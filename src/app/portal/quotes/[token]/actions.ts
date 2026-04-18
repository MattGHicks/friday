"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { QuoteStatus } from "@/generated/prisma/client";
import { acceptQuoteAndPrepareDeposit } from "@/lib/conversion";

export async function acceptQuote(token: string): Promise<{
  error?: string;
  success?: boolean;
  invoiceId?: string;
}> {
  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    select: { id: true, status: true, publicToken: true },
  });
  if (!quote) return { error: "Quote not found" };

  const result = await acceptQuoteAndPrepareDeposit(quote.id);
  if (result.error) return { error: result.error };

  revalidatePath(`/portal/quotes/${token}`);
  return { success: true, invoiceId: result.invoiceId };
}

export async function declineQuote(token: string): Promise<{
  error?: string;
  success?: boolean;
}> {
  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    select: { id: true, status: true },
  });
  if (!quote) return { error: "Quote not found" };
  if (quote.status === QuoteStatus.ACCEPTED)
    return { error: "Quote has already been accepted" };
  if (quote.status === QuoteStatus.DECLINED)
    return { error: "Quote has already been declined" };

  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: QuoteStatus.DECLINED, declinedAt: new Date() },
  });

  revalidatePath(`/portal/quotes/${token}`);
  return { success: true };
}
