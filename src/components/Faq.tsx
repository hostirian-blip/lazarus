// Landing-page FAQ. Uses native <details>/<summary> so it's accessible and
// works without JavaScript; styling lives in globals.css (.faq-*).

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What does Lazarus actually do?",
    a: "Lazarus works the leads already sitting dead in your CRM. It pulls those cold contacts in, sends compliant, AI-personalized SMS and email to re-engage them, and tracks which ones turn back into replies, booked calls, and revenue.",
  },
  {
    q: "Do I have to import a CSV, or can it connect to my CRM?",
    a: "Either. You can upload a CSV with the guided import wizard, or connect HubSpot or GoHighLevel directly and sync contacts in with one click. A workspace can connect both CRMs at the same time if you need to.",
  },
  {
    q: "Is the outreach actually compliant?",
    a: "Compliance is the gate every message passes through — it isn't optional. Lazarus checks explicit SMS and email consent before each send, honors STOP/unsubscribe instantly across channels, respects quiet hours, and keeps a per-message audit trail of who consented and when. No consent, no send.",
  },
  {
    q: "How do you prove the revenue is real and not a coincidence?",
    a: "Lazarus automatically holds back a control group, so you can compare revived leads against the ones you left untouched. You see revenue lift per lead and booking lift — net of a monthly research budget you cap yourself.",
  },
  {
    q: "Can I send from my own phone number and email?",
    a: "Yes. Each campaign chooses its lane: send through Lazarus's built-in gateway, or through your own back office — your Twilio number and your SMTP/email provider. Your gateway credentials are stored encrypted and never shared across tenants.",
  },
  {
    q: "How quickly can I get started?",
    a: "Minutes. Create an account, import a list or connect your CRM, confirm consent, and launch a campaign. You don't need anything else set up first.",
  },
  {
    q: "Is my data secure?",
    a: "Every workspace's data is isolated, and all credentials and CRM tokens are encrypted at rest with AES-256-GCM. We never put personal data in URLs, and consent state travels with every lead.",
  },
];

export function Faq() {
  return (
    <div className="faq-list">
      {FAQS.map((f, i) => (
        <details key={i} className="faq-item">
          <summary>
            <span className="faq-q">{f.q}</span>
            <span className="faq-mark" aria-hidden>+</span>
          </summary>
          <div className="faq-answer">{f.a}</div>
        </details>
      ))}
    </div>
  );
}
