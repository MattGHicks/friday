import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend | null {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn("RESEND_API_KEY is not set — email features disabled");
      return null;
    }
    _resend = new Resend(key);
  }
  return _resend;
}

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

type SendEmailResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const from =
    options.from ?? process.env.RESEND_FROM_EMAIL ?? "Friday <hello@itsfriday.dev>";

  try {
    const resend = getResend();
    if (!resend) {
      console.warn("[sendEmail] Resend not configured — skipping email");
      return { success: false, error: "Resend not configured" };
    }
    const { data, error } = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error("[sendEmail] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data!.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sendEmail] unexpected error:", message);
    return { success: false, error: message };
  }
}
