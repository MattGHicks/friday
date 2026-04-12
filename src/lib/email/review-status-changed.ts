type ReviewStatusChangedEmailProps = {
  freelancerName: string;
  clientName: string;
  projectName: string;
  fileName: string;
  status: "APPROVED" | "CHANGES_REQUESTED";
  portalUrl: string;
};

export function buildReviewStatusChangedEmail(
  props: ReviewStatusChangedEmailProps
): {
  subject: string;
  html: string;
  text: string;
} {
  const { freelancerName, clientName, projectName, fileName, status, portalUrl } = props;

  const isApproved = status === "APPROVED";

  const subject = isApproved
    ? `Design approved — ${projectName}`
    : `Changes requested on ${projectName}`;

  const statusPillBg = isApproved ? "#1a3a2a" : "#3a2a1a";
  const statusPillBorder = isApproved ? "#2a5a3a" : "#5a3a1a";
  const statusPillText = isApproved ? "#4ade80" : "#F0A830";
  const statusLabel = isApproved ? "Approved" : "Changes requested";

  const bodyMessage = isApproved
    ? `<strong style="color:#e5e5e5;">${freelancerName}</strong> has approved the design for
       <strong style="color:#e5e5e5;">${projectName}</strong>. Everything looks great.`
    : `<strong style="color:#e5e5e5;">${freelancerName}</strong> has reviewed
       <strong style="color:#e5e5e5;">${projectName}</strong> and left feedback requesting changes.
       Head to your portal to see the notes.`;

  const plainBodyMessage = isApproved
    ? `${freelancerName} has approved the design for ${projectName}. Everything looks great.`
    : `${freelancerName} has reviewed ${projectName} and left feedback requesting changes. Head to your portal to see the notes.`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'DM Sans',system-ui,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#141414;border-radius:12px;overflow:hidden;border:1px solid #242424;">

        <!-- Gradient accent rule -->
        <tr>
          <td style="height:4px;background:linear-gradient(90deg,#E55A3A,#F0A830,#F5EDD0);"></td>
        </tr>

        <!-- Header -->
        <tr>
          <td style="padding:24px 32px 20px;border-bottom:1px solid #242424;">
            <span style="font-size:20px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;background:linear-gradient(90deg,#E55A3A,#F0A830);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">FRIDAY</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:15px;">Hi ${clientName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#bbb;">${bodyMessage}</p>

            <!-- File + status pill -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%;">
              <tr>
                <td style="background:#1c1c1c;border:1px solid #2a2a2a;border-radius:8px;padding:12px 16px;">
                  <p style="margin:0 0 6px;font-size:13px;color:#888;letter-spacing:0.04em;text-transform:uppercase;">File reviewed</p>
                  <p style="margin:0 0 10px;font-size:15px;font-weight:600;color:#e5e5e5;">${fileName}</p>
                  <span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;letter-spacing:0.04em;background:${statusPillBg};border:1px solid ${statusPillBorder};color:${statusPillText};">${statusLabel}</span>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <a href="${portalUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(90deg,#E55A3A,#F0A830);color:#0f0f0f;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">View in portal</a>
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

  const text = `Hi ${clientName},

${plainBodyMessage}

File reviewed: ${fileName}
Status: ${statusLabel}

View it in your portal: ${portalUrl}

---
Sent via Friday`;

  return { subject, html, text };
}
