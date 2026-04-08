import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateReview } from "../../review-actions";
import { ReviewViewer } from "./review-viewer";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string; fileId: string }>;
}) {
  const { id: projectId, fileId } = await params;

  const user = await getCurrentUser();
  if (!user) return null;

  // Load file, verify it belongs to this user's project
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      project: { id: projectId, userId: user.id },
    },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  if (!file) notFound();

  // Only image files can be reviewed
  if (!file.mimeType.startsWith("image/")) notFound();

  // Get or create the review
  const { reviewId, error } = await getOrCreateReview(fileId);
  if (error || !reviewId) notFound();

  // Load annotations with replies
  const review = await prisma.review.findFirst({
    where: { id: reviewId },
    include: {
      annotations: {
        where: { parentId: null },
        include: {
          replies: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!review) notFound();

  return (
    <ReviewViewer
      projectId={file.project.id}
      projectName={file.project.name}
      reviewId={review.id}
      reviewStatus={review.status}
      file={{
        id: file.id,
        name: file.name,
        url: file.url,
        mimeType: file.mimeType,
      }}
      annotations={review.annotations.map((a) => ({
        id: a.id,
        x: a.x,
        y: a.y,
        comment: a.comment,
        isResolved: a.isResolved,
        createdAt: a.createdAt,
        replies: a.replies.map((r) => ({
          id: r.id,
          comment: r.comment,
          createdAt: r.createdAt,
        })),
      }))}
    />
  );
}
