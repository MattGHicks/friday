type NewMessageEmailProps = {
  freelancerName: string;
  freelancerLogoUrl: string | null;
  freelancerBrandColor: string;
  senderName: string;
  clientFirstName: string;
  projectName: string;
  bodyText: string;
  portalUrl: string;
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function bodyToHtml(text: string): string {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function buildNewMessageEmail(props: NewMessageEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    freelancerName,
    freelancerLogoUrl,
    freelancerBrandColor,
    senderName,
    clientFirstName,
    projectName,
    bodyText,
    portalUrl,
  } = props;

  const brand = freelancerBrandColor;
  const subject = `New message — ${projectName}`;

  const brandHeader = freelancerLogoUrl
    ? `<img src="${freelancerLogoUrl}" alt="${escapeHtml(freelancerName)}" style="max-height:36px;max-width:180px;display:block;" />`
    : `<span style="font-size:18px;font-weight:700;color:${brand};">${escapeHtml(freelancerName)}</span>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'DM Sans',system-ui,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#141414;border-radius:12px;overflow:hidden;border:1px solid #242424;">

        <!-- Header -->
        <tr>
          <td style="padding:24px 32px 20px;border-bottom:1px solid #242424;">
            ${brandHeader}
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:15px;">Hi ${escapeHtml(clientFirstName)},</p>
            <p style="margin:0 0 20px;font-size:15px;color:#bbb;">
              <strong style="color:#e5e5e5;">${escapeHtml(senderName)}</strong> sent a message about
              <strong style="color:#e5e5e5;">${escapeHtml(projectName)}</strong>.
            </p>

            <!-- Quoted body -->
            <div style="background:#1c1c1c;border-left:3px solid ${brand};border-radius:4px;padding:16px 18px;margin:0 0 24px;font-size:14px;color:#d4d4d4;line-height:1.55;">
              ${bodyToHtml(bodyText)}
            </div>

            <p style="margin:0 0 24px;font-size:14px;color:#888;">
              Reply to this email or view the full conversation in your portal.
            </p>

            <!-- CTA -->
            <a href="${portalUrl}" style="display:inline-block;padding:12px 28px;background:${brand};color:#0f0f0f;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">Open in portal</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #242424;font-size:12px;color:#555;">
            Sent via <a href="https://itsfriday.dev" style="color:#777;">Friday</a> · Your client portal for design projects.
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${clientFirstName},

${senderName} sent a message about ${projectName}:

${bodyText}

---
Reply to this email or view the conversation in your portal:
${portalUrl}

Sent via Friday`;

  return { subject, html, text };
}
