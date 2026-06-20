import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { pdf } from "@react-pdf/renderer";
import { InvoiceDocument } from "./invoice-document";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params;

  // Auth: get supabase user then look up Prisma user
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
  const {
    data: { user: sbUser },
  } = await supabase.auth.getUser();

  if (!sbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId },
    include: {
      project: { select: { id: true, name: true, userId: true } },
      client: { select: { name: true, company: true, email: true } },
      user: {
        select: {
          name: true,
          email: true,
          brandColor: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!invoice || invoice.project.userId !== sbUser.id) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const stream = await pdf(InvoiceDocument({ invoice })).toBuffer();

  const shortId = invoice.id.slice(0, 8).toUpperCase();
  const filename = `invoice-${shortId}.pdf`;

  // Collect chunks from the Node.js ReadableStream into a Buffer
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  const pdfBuffer = Buffer.concat(chunks);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.byteLength.toString(),
    },
  });
}
