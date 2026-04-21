"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  InvoiceStatus,
  ActivityType,
  ProjectStatus,
} from "@/generated/prisma/client";
import { logActivity } from "./log-activity";
import { getResend } from "@/lib/resend";
import { buildInvoiceSentEmail } from "@/lib/email/invoice-sent";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // cents
};

export async function createInvoice(
  formData: FormData
): Promise<{ error?: string; success?: boolean; invoiceId?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const projectId = formData.get("projectId") as string | null;
  const clientId = formData.get("clientId") as string | null;
  const lineItemsJson = formData.get("lineItemsJson") as string | null;
  const taxPercentStr = formData.get("taxPercent") as string | null;
  const notes = (formData.get("notes") as string | null) || null;
  const dueDateStr = formData.get("dueDate") as string | null;

  if (!projectId) return { error: "Project ID is required" };
  if (!clientId) return { error: "Client ID is required" };
  if (!lineItemsJson) return { error: "Line items are required" };

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) return { error: "Project not found" };

  let lineItems: LineItem[];
  try {
    lineItems = JSON.parse(lineItemsJson);
  } catch {
    return { error: "Invalid line items format" };
  }

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return { error: "At least one line item is required" };
  }

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const taxPercent = parseFloat(taxPercentStr ?? "0") || 0;
  const tax = Math.round(subtotal * (taxPercent / 100));
  const total = subtotal + tax;

  const dueDate = dueDateStr ? new Date(dueDateStr) : null;

  const invoice = await prisma.invoice.create({
    data: {
      projectId,
      clientId,
      userId: user.id,
      lineItems,
      subtotal,
      tax,
      total,
      status: InvoiceStatus.DRAFT,
      dueDate,
      notes,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/invoices");
  return { success: true, invoiceId: invoice.id };
}

export async function deleteInvoice(
  invoiceId: string
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId },
    include: { project: { select: { userId: true, id: true } } },
  });

  if (!invoice) return { error: "Invoice not found" };
  if (invoice.project.userId !== user.id) return { error: "Invoice not found" };
  // Only allow deleting drafts
  if (invoice.status !== "DRAFT") return { error: "Only draft invoices can be deleted" };

  await prisma.invoice.delete({ where: { id: invoiceId } });

  revalidatePath(`/projects/${invoice.project.id}`);
  revalidatePath("/invoices");
  return { success: true };
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  // Load invoice and verify ownership via its project
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId },
    include: {
      project: { select: { userId: true, id: true, name: true } },
      client: { select: { name: true, company: true, email: true } },
    },
  });

  if (!invoice) return { error: "Invoice not found" };
  if (invoice.project.userId !== user.id) return { error: "Invoice not found" };

  const paidAt =
    status === InvoiceStatus.PAID ? new Date() : invoice.paidAt ?? null;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status, paidAt },
  });

  if (status === InvoiceStatus.SENT) {
    await logActivity({
      userId: user.id,
      projectId: invoice.project.id,
      actorId: user.id,
      action: ActivityType.INVOICE_SENT,
      metadata: { invoiceId, total: invoice.total, isDeposit: invoice.isDeposit },
    });

    // Send email notification to client
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://itsfriday.dev";
      const portalUrl = `${appUrl}/portal/projects/${invoice.project.id}`;
      const clientDisplayName =
        invoice.client.company ?? invoice.client.name;
      const dueDateStr = invoice.dueDate
        ? invoice.dueDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : null;

      const lineItems = invoice.lineItems as Array<{
        description: string;
        quantity: number;
        unitPrice: number;
      }>;

      const { subject, html, text } = buildInvoiceSentEmail({
        freelancerName: user.name ?? user.email,
        clientName: clientDisplayName,
        projectName: invoice.project.name,
        invoiceId,
        totalCents: invoice.total,
        dueDateStr,
        lineItems,
        portalUrl,
        notes: invoice.notes,
      });

      const resend = getResend();
      if (!resend) {
        console.warn("[invoice-sent-email] Resend not configured — skipping");
      } else {
      await resend.emails.send({
        from: "Friday <invoices@itsfriday.dev>",
        to: invoice.client.email,
        subject,
        html,
        text,
      });
      }
    } catch (err) {
      // Email failure must never block the invoice status update
      console.error("[invoice-sent-email] failed to send:", err);
    }
  } else if (status === InvoiceStatus.PAID) {
    await logActivity({
      userId: user.id,
      projectId: invoice.project.id,
      actorId: user.id,
      action: ActivityType.INVOICE_PAID,
      metadata: { invoiceId, total: invoice.total },
    });

    // Deposit paid → activate the linked project and stamp the quote.
    if (invoice.isDeposit && invoice.quoteId) {
      await prisma.project.update({
        where: { id: invoice.project.id },
        data: { status: ProjectStatus.ACTIVE },
      });
      await prisma.quote.update({
        where: { id: invoice.quoteId },
        data: { depositPaidAt: new Date() },
      });
    }
  }

  revalidatePath(`/projects/${invoice.project.id}`);
  revalidatePath("/invoices");
  return { success: true };
}
