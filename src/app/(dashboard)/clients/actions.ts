"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  company: z.string().optional().transform((v) => v || null),
  phone: z.string().optional().transform((v) => v || null),
  notes: z.string().optional().transform((v) => v || null),
});

export type ClientFormState = {
  error?: string;
  success?: boolean;
};

export async function createClient(
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.client.create({
      data: {
        userId: user.id,
        ...parsed.data,
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint")
    ) {
      return { error: "You already have a client with this email" };
    }
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/dashboard/clients");
  return { success: true };
}

export async function updateClient(
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const clientId = formData.get("clientId") as string;
  if (!clientId) return { error: "Client not found" };

  // Verify ownership
  const existing = await prisma.client.findFirst({
    where: { id: clientId, userId: user.id },
  });
  if (!existing) return { error: "Client not found" };

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: parsed.data,
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint")
    ) {
      return { error: "You already have a client with this email" };
    }
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/dashboard/clients");
  return { success: true };
}

export async function deleteClient(clientId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  // Verify ownership
  const existing = await prisma.client.findFirst({
    where: { id: clientId, userId: user.id },
  });
  if (!existing) return { error: "Client not found" };

  await prisma.client.delete({
    where: { id: clientId },
  });

  revalidatePath("/dashboard/clients");
  return { success: true };
}
