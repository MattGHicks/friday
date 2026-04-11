/**
 * Base email layout for Friday transactional emails.
 *
 * Usage — wrap any email body HTML in the branded shell:
 *
 *   import { wrapInBaseLayout } from "@/lib/email-templates/base-layout";
 *   const html = wrapInBaseLayout({ body: "<p>Hello!</p>", previewText: "..." });
 *
 * This module also exports a React component (BaseEmailLayout) for
 * future use with @react-email/render or ReactDOMServer.renderToStaticMarkup.
 */

type BaseEmailLayoutProps = {
  children: React.ReactNode;
  previewText?: string;
};

/**
 * React component for the Friday branded email shell.
 * Dark background, fire→gold gradient header rule, simple footer.
 *
 * For now this is used via wrapInBaseLayout() (HTML string approach).
 * When @react-email/components is added, swap the imports and use this
 * component directly with resend.emails.send({ react: <BaseEmailLayout> }).
 */
export function BaseEmailLayout({ children, previewText }: BaseEmailLayoutProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {previewText && (
          <span
            style={{
              display: "none",
              fontSize: 1,
              lineHeight: 1,
              color: "transparent",
              maxHeight: 0,
              maxWidth: 0,
              opacity: 0,
              overflow: "hidden",
            }}
          >
            {previewText}
          </span>
        )}
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0f0f0f",
          fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
          color: "#e5e5e5",
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: "#0f0f0f", padding: "40px 20px" }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  width="100%"
                  style={{
                    maxWidth: 560,
                    backgroundColor: "#141414",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid #242424",
                  }}
                >
                  <tbody>
                    {/* Gradient header rule */}
                    <tr>
                      <td
                        style={{
                          height: 4,
                          background: "linear-gradient(90deg, #E55A3A, #F0A830, #F5EDD0)",
                        }}
                      />
                    </tr>

                    {/* Logo header */}
                    <tr>
                      <td
                        style={{
                          padding: "24px 32px 20px",
                          borderBottom: "1px solid #242424",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            background: "linear-gradient(90deg, #E55A3A, #F0A830)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          FRIDAY
                        </span>
                      </td>
                    </tr>

                    {/* Content slot */}
                    <tr>
                      <td style={{ padding: "28px 32px" }}>{children}</td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td
                        style={{
                          padding: "16px 32px",
                          borderTop: "1px solid #242424",
                          fontSize: 12,
                          color: "#555",
                        }}
                      >
                        Sent via{" "}
                        <a href="https://itsfriday.dev" style={{ color: "#777" }}>
                          Friday
                        </a>{" "}
                        · Your client portal for design projects.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

/**
 * Wraps an HTML body string in the Friday branded email shell.
 * Use this when building emails as raw HTML (e.g. buildInvoiceSentEmail).
 */
export function wrapInBaseLayout({
  body,
  previewText,
}: {
  body: string;
  previewText?: string;
}): string {
  const preview = previewText
    ? `<span style="display:none;font-size:1px;line-height:1px;color:transparent;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(previewText)}</span>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  ${preview}
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'DM Sans',system-ui,-apple-system,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#141414;border-radius:12px;overflow:hidden;border:1px solid #242424;">

        <!-- Gradient accent rule -->
        <tr>
          <td style="height:4px;background:linear-gradient(90deg,#E55A3A,#F0A830,#F5EDD0);"></td>
        </tr>

        <!-- Logo header -->
        <tr>
          <td style="padding:24px 32px 20px;border-bottom:1px solid #242424;">
            <span style="font-size:20px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;background:linear-gradient(90deg,#E55A3A,#F0A830);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">FRIDAY</span>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:28px 32px;">
            ${body}
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
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
