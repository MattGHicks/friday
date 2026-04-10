"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ImportRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  notes: string;
};

export type ImportResult = {
  imported: number;
  skipped: number;
  error?: string;
};

export async function importContacts(contacts: ImportRow[]): Promise<ImportResult> {
  const user = await getCurrentUser();
  if (!user) return { imported: 0, skipped: 0, error: "Not authenticated" };

  if (!contacts || contacts.length === 0) {
    return { imported: 0, skipped: 0 };
  }

  // Load all existing clients for this user (for dedup by company name + email)
  const existingClients = await prisma.client.findMany({
    where: { userId: user.id },
    select: { id: true, email: true, name: true, company: true },
  });

  const existingByEmail = new Map(
    existingClients.map((c) => [c.email.toLowerCase(), c])
  );
  const existingByCompany = new Map(
    existingClients
      .filter((c) => c.company)
      .map((c) => [c.company!.toLowerCase(), c])
  );

  let imported = 0;
  let skipped = 0;

  // Group contacts by organization
  const withOrg: ImportRow[] = [];
  const withoutOrg: ImportRow[] = [];

  for (const row of contacts) {
    if (row.organization.trim()) {
      withOrg.push(row);
    } else {
      withoutOrg.push(row);
    }
  }

  // ── Contacts with organization ───────────────────────────────
  // Group them by org name, then find-or-create a Client per org
  const byOrg = new Map<string, ImportRow[]>();
  for (const row of withOrg) {
    const orgKey = row.organization.trim().toLowerCase();
    if (!byOrg.has(orgKey)) byOrg.set(orgKey, []);
    byOrg.get(orgKey)!.push(row);
  }

  for (const [orgKey, rows] of byOrg.entries()) {
    const orgName = rows[0].organization.trim();

    // Find or create the Client record for this org
    let client = existingByCompany.get(orgKey) ?? null;

    if (!client) {
      // Use the first contact's email as the client email, or a placeholder
      const primaryRow = rows.find((r) => r.email.trim()) ?? rows[0];
      const clientEmail = primaryRow.email.trim() || `${orgKey.replace(/\s+/g, ".")}@imported.local`;

      // Avoid email collision with an existing client
      if (existingByEmail.has(clientEmail.toLowerCase())) {
        // Attach contacts to that existing client instead
        const existingClient = existingByEmail.get(clientEmail.toLowerCase())!;
        client = existingClient;
      } else {
        try {
          const created = await prisma.client.create({
            data: {
              userId: user.id,
              name: orgName,
              email: clientEmail,
              company: orgName,
              phone: primaryRow.phone.trim() || null,
              notes: null,
            },
          });
          client = { id: created.id, email: created.email, name: created.name, company: created.company };
          existingByCompany.set(orgKey, client);
          existingByEmail.set(created.email.toLowerCase(), client);
        } catch {
          skipped += rows.length;
          continue;
        }
      }
    }

    // Now create Contact records for each row under this client
    for (const row of rows) {
      const fullName = [row.firstName, row.lastName].filter(Boolean).join(" ") || "Unknown";
      try {
        await prisma.contact.create({
          data: {
            clientId: client.id,
            name: fullName,
            email: row.email.trim() || null,
            phone: row.phone.trim() || null,
            notes: row.notes.trim() || null,
            isPrimary: false,
          },
        });
        imported++;
      } catch {
        skipped++;
      }
    }
  }

  // ── Contacts without organization → standalone Clients ───────
  for (const row of withoutOrg) {
    const fullName = [row.firstName, row.lastName].filter(Boolean).join(" ") || "Unknown";
    const email = row.email.trim();

    if (!email) {
      // Can't create a client without an email; skip
      skipped++;
      continue;
    }

    if (existingByEmail.has(email.toLowerCase())) {
      // Already exists — caller should have excluded these, but skip defensively
      skipped++;
      continue;
    }

    try {
      const created = await prisma.client.create({
        data: {
          userId: user.id,
          name: fullName,
          email,
          company: null,
          phone: row.phone.trim() || null,
          notes: row.notes.trim() || null,
        },
      });
      existingByEmail.set(email.toLowerCase(), {
        id: created.id,
        email: created.email,
        name: created.name,
        company: created.company,
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  revalidatePath("/clients");
  return { imported, skipped };
}
