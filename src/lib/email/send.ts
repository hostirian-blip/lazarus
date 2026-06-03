// Email send via provider (Postmark/SendGrid/SES) with SPF/DKIM/DMARC.
// Include one-click unsubscribe (CAN-SPAM). Capture replies via inbound webhook.
export async function sendEmail(_args: { to: string; subject: string; body: string }): Promise<void> {
  throw new Error("not implemented: sendEmail");
}
