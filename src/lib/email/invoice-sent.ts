type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number; // cents
};

type InvoiceSentEmailProps = {
  freelancerName: string;
  clientName: string;
  projectName: string;
  invoiceId: string;
  totalCents: number;
  dueDateStr: string | null;
  lineItems: LineItem[];
  portalUrl: string;
  notes: string | null;
};

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function buildInvoiceSentEmail(props: InvoiceSentEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    freelancerName,
    clientName,
    projectName,
    totalCents,
    dueDateStr,
    lineItems,
    portalUrl,
    notes,
  } = props;

  const subject = `Invoice from ${freelancerName} — ${projectName}`;

  const lineItemRows = lineItems
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;">${item.description}</td>
          <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;text-align:right;">${formatMoney(item.unitPrice)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;text-align:right;">${formatMoney(item.quantity * item.unitPrice)}</td>
        </tr>`
    )
    .join("");

  const lineItemRowsText = lineItems
    .map(
      (item) =>
        `  ${item.description} × ${item.quantity} = ${formatMoney(item.quantity * item.unitPrice)}`
    )
    .join("\n");

  const dueNote = dueDateStr
    ? `<p style="margin:0 0 8px;">Due: <strong>${dueDateStr}</strong></p>`
    : "";

  const dueNoteText = dueDateStr ? `Due: ${dueDateStr}\n` : "";

  const notesHtml = notes
    ? `<p style="margin:16px 0 0;color:#999;font-size:14px;">${notes}</p>`
    : "";

  const notesText = notes ? `\nNotes: ${notes}` : "";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'DM Sans',system-ui,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#141414;border-radius:12px;overflow:hidden;border:1px solid #242424;">

        <!-- Header -->
        <tr>
          <td style="padding:32px 32px 24px;border-bottom:1px solid #242424;">
            <p style="margin:0 0 4px;font-size:13px;color:#888;letter-spacing:0.05em;text-transform:uppercase;">Invoice from</p>
            <h1 style="margin:0;font-size:22px;font-weight:700;background:linear-gradient(90deg,#E55A3A,#F0A830);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${freelancerName}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:15px;">Hi ${clientName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#bbb;">Here is your invoice for <strong style="color:#e5e5e5;">${projectName}</strong>.</p>

            <!-- Line items -->
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:0 0 24px;">
              <thead>
                <tr style="color:#888;">
                  <th style="padding:0 0 8px;text-align:left;font-weight:500;">Description</th>
                  <th style="padding:0 0 8px;text-align:center;font-weight:500;">Qty</th>
                  <th style="padding:0 0 8px;text-align:right;font-weight:500;">Rate</th>
                  <th style="padding:0 0 8px;text-align:right;font-weight:500;">Amount</th>
                </tr>
              </thead>
              <tbody>${lineItemRows}</tbody>
            </table>

            <!-- Total -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="font-size:15px;color:#888;">Total due</td>
                <td style="font-size:22px;font-weight:700;text-align:right;color:#F0A830;">${formatMoney(totalCents)}</td>
              </tr>
            </table>

            ${dueNote}

            <!-- CTA -->
            <a href="${portalUrl}" style="display:inline-block;margin:20px 0 0;padding:12px 28px;background:linear-gradient(90deg,#E55A3A,#F0A830);color:#0f0f0f;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">View Invoice</a>

            ${notesHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #242424;font-size:12px;color:#555;">
            Sent via Friday · <a href="${portalUrl}" style="color:#888;">View in portal</a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Invoice from ${freelancerName}

Hi ${clientName},

Here is your invoice for ${projectName}.

${lineItemRowsText}

Total due: ${formatMoney(totalCents)}
${dueNoteText}
View your invoice: ${portalUrl}
${notesText}

---
Sent via Friday`;

  return { subject, html, text };
}
