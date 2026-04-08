"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { InvoiceStatus, ActivityType } from "@/generated/prisma/client";
import { logActivity } from "./log-activity";

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
    include: { project: { select: { userId: true, id: true } } },
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
    await logActivity(invoice.project.id, user.id, ActivityType.INVOICE_SENT, {
      invoiceId,
      total: invoice.total,
    });
  } else if (status === InvoiceStatus.PAID) {
    await logActivity(invoice.project.id, user.id, ActivityType.INVOICE_PAID, {
      invoiceId,
      total: invoice.total,
    });
  }

  revalidatePath(`/projects/${invoice.project.id}`);
  return { success: true };
}
