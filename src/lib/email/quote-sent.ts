type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number; // cents
};

type QuoteSentEmailProps = {
  freelancerName: string;
  freelancerLogoUrl: string | null;
  freelancerBrandColor: string;
  clientName: string;
  quoteSubject: string;
  totalCents: number;
  depositCents: number;
  lineItems: LineItem[];
  publicUrl: string;
  notes: string | null;
  customMessage: string | null;
};

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildQuoteSentEmail(props: QuoteSentEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    freelancerName,
    freelancerLogoUrl,
    freelancerBrandColor,
    clientName,
    quoteSubject,
    totalCents,
    depositCents,
    lineItems,
    publicUrl,
    notes,
    customMessage,
  } = props;

  const brand = freelancerBrandColor;
  const subject = `Quote from ${freelancerName} — ${quoteSubject}`;

  const lineItemRows = lineItems
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;">${escapeHtml(item.description)}</td>
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

  const depositRow =
    depositCents > 0
      ? `<tr><td style="font-size:14px;color:#888;">Deposit to start</td><td style="font-size:14px;color:${brand};text-align:right;">${formatMoney(depositCents)}</td></tr>`
      : "";

  const depositText =
    depositCents > 0
      ? `Deposit to start: ${formatMoney(depositCents)}\n`
      : "";

  const customMessageHtml = customMessage
    ? `<div style="margin:0 0 24px;padding:16px 20px;background:#1a1a1a;border-left:3px solid ${brand};border-radius:4px;">
          <p style="margin:0;font-size:15px;color:#ddd;white-space:pre-wrap;">${escapeHtml(customMessage)}</p>
        </div>`
    : "";

  const customMessageText = customMessage ? `\n${customMessage}\n` : "";

  const notesHtml = notes
    ? `<p style="margin:16px 0 0;color:#999;font-size:14px;">${escapeHtml(notes)}</p>`
    : "";

  const notesText = notes ? `\nNotes: ${notes}` : "";

  const brandHeader = freelancerLogoUrl
    ? `<img src="${freelancerLogoUrl}" alt="${escapeHtml(freelancerName)}" style="max-height:40px;max-width:200px;display:block;" />`
    : `<h1 style="margin:0;font-size:22px;font-weight:700;color:${brand};">${escapeHtml(freelancerName)}</h1>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'DM Sans',system-ui,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#141414;border-radius:12px;overflow:hidden;border:1px solid #242424;">
        <tr>
          <td style="padding:32px 32px 24px;border-bottom:1px solid #242424;">
            <p style="margin:0 0 8px;font-size:13px;color:#888;letter-spacing:0.05em;text-transform:uppercase;">Quote from</p>
            ${brandHeader}
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:15px;">Hi ${escapeHtml(clientName)},</p>
            ${customMessageHtml}
            <p style="margin:0 0 24px;font-size:15px;color:#bbb;">Here is a quote for <strong style="color:#e5e5e5;">${escapeHtml(quoteSubject)}</strong>.</p>
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
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="font-size:15px;color:#888;">Total</td>
                <td style="font-size:22px;font-weight:700;text-align:right;color:${brand};">${formatMoney(totalCents)}</td>
              </tr>
              ${depositRow}
            </table>
            <a href="${publicUrl}" style="display:inline-block;margin:20px 0 0;padding:12px 28px;background:${brand};color:#0f0f0f;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">Review Quote</a>
            ${notesHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #242424;font-size:12px;color:#555;">
            Sent via <a href="https://itsfriday.dev" style="color:#777;">Friday</a> · <a href="${publicUrl}" style="color:#888;">Open quote</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Quote from ${freelancerName}

Hi ${clientName},
${customMessageText}
Here is a quote for ${quoteSubject}.

${lineItemRowsText}

Total: ${formatMoney(totalCents)}
${depositText}
Review your quote: ${publicUrl}
${notesText}

---
Sent via Friday`;

  return { subject, html, text };
}
