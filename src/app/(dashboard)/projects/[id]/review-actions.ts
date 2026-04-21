"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ActorType, ReviewStatus, ActivityType } from "@/generated/prisma/client";
import { logActivity } from "./log-activity";
import { sendEmail } from "@/lib/resend";
import { buildReviewStatusChangedEmail } from "@/lib/email/review-status-changed";

export type AnnotationData = {
  id: string;
  reviewId: string;
  authorId: string;
  authorType: ActorType;
  x: number;
  y: number;
  comment: string;
  isResolved: boolean;
  parentId: string | null;
  createdAt: Date;
};

// Creates or gets the review for a file
export async function getOrCreateReview(
  fileId: string
): Promise<{ reviewId?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  // Load file and verify it belongs to a project owned by this user
  const file = await prisma.file.findFirst({
    where: { id: fileId, project: { userId: user.id } },
    include: { project: { select: { id: true } } },
  });
  if (!file) return { error: "File not found" };

  // Find existing review or create one
  const existing = await prisma.review.findFirst({
    where: { fileId },
  });
  if (existing) return { reviewId: existing.id };

  const review = await prisma.review.create({
    data: {
      fileId,
      projectId: file.project.id,
      status: ReviewStatus.PENDING,
    },
  });

  return { reviewId: review.id };
}

// Adds a top-level annotation pin
export async function addAnnotation(
  reviewId: string,
  x: number,
  y: number,
  comment: string
): Promise<{ error?: string; annotation?: AnnotationData }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const review = await prisma.review.findFirst({
    where: { id: reviewId },
    include: { project: { select: { id: true, userId: true } } },
  });
  if (!review) return { error: "Review not found" };
  if (review.project.userId !== user.id) return { error: "Review not found" };

  const annotation = await prisma.annotation.create({
    data: {
      reviewId,
      authorId: user.id,
      authorType: ActorType.USER,
      x,
      y,
      comment,
    },
  });

  await logActivity({
    userId: user.id,
    projectId: review.project.id,
    actorId: user.id,
    action: ActivityType.COMMENT_ADDED,
    metadata: { reviewId, comment: comment.slice(0, 100) },
  });

  revalidatePath(`/projects/${review.project.id}/review/${review.fileId}`);
  return { annotation };
}

// Adds a reply to an existing annotation
export async function addReply(
  parentId: string,
  comment: string
): Promise<{ error?: string; reply?: AnnotationData }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const parent = await prisma.annotation.findFirst({
    where: { id: parentId },
    select: {
      id: true,
      reviewId: true,
      review: {
        select: {
          id: true,
          fileId: true,
          project: { select: { id: true, userId: true } },
        },
      },
    },
  });
  if (!parent) return { error: "Annotation not found" };
  if (parent.review.project.userId !== user.id)
    return { error: "Annotation not found" };

  const reply = await prisma.annotation.create({
    data: {
      reviewId: parent.reviewId,
      authorId: user.id,
      authorType: ActorType.USER,
      x: 0,
      y: 0,
      comment,
      parentId,
    },
  });

  revalidatePath(
    `/projects/${parent.review.project.id}/review/${parent.review.fileId}`
  );
  return { reply };
}

// Toggles isResolved on an annotation
export async function toggleAnnotationResolved(
  annotationId: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const annotation = await prisma.annotation.findFirst({
    where: { id: annotationId },
    select: {
      id: true,
      isResolved: true,
      review: {
        select: {
          id: true,
          fileId: true,
          project: { select: { id: true, userId: true } },
        },
      },
    },
  });
  if (!annotation) return { error: "Annotation not found" };
  if (annotation.review.project.userId !== user.id)
    return { error: "Annotation not found" };

  await prisma.annotation.update({
    where: { id: annotationId },
    data: { isResolved: !annotation.isResolved },
  });

  revalidatePath(
    `/projects/${annotation.review.project.id}/review/${annotation.review.fileId}`
  );
  return {};
}

// Updates review status
export async function updateReviewStatus(
  reviewId: string,
  status: "PENDING" | "CHANGES_REQUESTED" | "APPROVED"
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const review = await prisma.review.findFirst({
    where: { id: reviewId },
    include: {
      project: {
        select: {
          id: true,
          userId: true,
          clientId: true,
          name: true,
          client: { select: { name: true, email: true } },
          user: {
            select: {
              name: true,
              email: true,
              logoUrl: true,
              brandColor: true,
            },
          },
        },
      },
      file: { select: { name: true } },
    },
  });
  if (!review) return { error: "Review not found" };
  if (review.project.userId !== user.id) return { error: "Review not found" };

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: status as ReviewStatus },
  });

  if (status === "APPROVED") {
    await logActivity({
      userId: user.id,
      projectId: review.project.id,
      actorId: user.id,
      action: ActivityType.REVIEW_APPROVED,
      metadata: { reviewId },
    });
  } else if (status === "CHANGES_REQUESTED") {
    await logActivity({
      userId: user.id,
      projectId: review.project.id,
      actorId: user.id,
      action: ActivityType.REVIEW_CHANGES_REQUESTED,
      metadata: { reviewId },
    });
  }

  // Notify client by email when status changes to APPROVED or CHANGES_REQUESTED
  if (status === "APPROVED" || status === "CHANGES_REQUESTED") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://itsfriday.dev";
    const portalUrl = `${appUrl}/portal/projects/${review.project.id}`;
    const freelancerDisplayName =
      review.project.user.name ?? review.project.user.email;
    const { subject, html, text } = buildReviewStatusChangedEmail({
      freelancerName: freelancerDisplayName,
      freelancerLogoUrl: review.project.user.logoUrl,
      freelancerBrandColor: review.project.user.brandColor,
      clientName: review.project.client.name,
      projectName: review.project.name,
      fileName: review.file.name,
      status,
      portalUrl,
    });
    sendEmail({
      to: review.project.client.email,
      subject,
      html,
      text,
      from: `${freelancerDisplayName} <hello@itsfriday.dev>`,
      replyTo: review.project.user.email,
    }).catch(
      (err) => void console.error("[updateReviewStatus] email send failed:", err)
    );
  }

  revalidatePath(`/projects/${review.project.id}/review/${review.fileId}`);
  return {};
}
