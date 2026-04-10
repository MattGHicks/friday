"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ── Create ────────────────────────────────────────────────── */

export async function createContact(
  clientId: string,
  data: {
    name: string;
    email?: string;
    phone?: string;
    title?: string;
    notes?: string;
    isPrimary?: boolean;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify client belongs to this user
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: user.id },
    include: { _count: { select: { contacts: true } } },
  });
  if (!client) throw new Error("Client not found");

  // If this is the first contact, always make it primary
  const isFirst = client._count.contacts === 0;
  const makePrimary = isFirst || data.isPrimary;

  // If marking as primary, demote all others first
  if (makePrimary) {
    await prisma.contact.updateMany({
      where: { clientId },
      data: { isPrimary: false },
    });
  }

  await prisma.contact.create({
    data: {
      clientId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      title: data.title || null,
      notes: data.notes || null,
      isPrimary: makePrimary ?? false,
    },
  });

  revalidatePath(`/clients/${clientId}`);
}

/* ── Update ────────────────────────────────────────────────── */

export async function updateContact(
  contactId: string,
  data: {
    name: string;
    email?: string;
    phone?: string;
    title?: string;
    notes?: string;
    isPrimary?: boolean;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, client: { userId: user.id } },
  });
  if (!contact) throw new Error("Contact not found");

  // If marking as primary, demote all others in this client first
  if (data.isPrimary) {
    await prisma.contact.updateMany({
      where: { clientId: contact.clientId },
      data: { isPrimary: false },
    });
  }

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      title: data.title || null,
      notes: data.notes || null,
      isPrimary: data.isPrimary ?? contact.isPrimary,
    },
  });

  revalidatePath(`/clients/${contact.clientId}`);
}

/* ── Delete ────────────────────────────────────────────────── */

export async function deleteContact(contactId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, client: { userId: user.id } },
  });
  if (!contact) throw new Error("Contact not found");

  await prisma.contact.delete({ where: { id: contactId } });

  // If the deleted contact was primary, promote the next oldest
  if (contact.isPrimary) {
    const next = await prisma.contact.findFirst({
      where: { clientId: contact.clientId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.contact.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  revalidatePath(`/clients/${contact.clientId}`);
}

/* ── Set primary ───────────────────────────────────────────── */

export async function setPrimaryContact(contactId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, client: { userId: user.id } },
  });
  if (!contact) throw new Error("Contact not found");

  await prisma.contact.updateMany({
    where: { clientId: contact.clientId },
    data: { isPrimary: false },
  });

  await prisma.contact.update({
    where: { id: contactId },
    data: { isPrimary: true },
  });

  revalidatePath(`/clients/${contact.clientId}`);
}
