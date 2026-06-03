// Render a campaign step template with simple {{var}} substitution. Pure/testable.
export interface TemplateVars {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  email?: string | null;
}

export function renderTemplate(body: string, vars: TemplateVars): string {
  const map: Record<string, string> = {
    firstName: vars.firstName?.trim() || "there",
    lastName: vars.lastName?.trim() || "",
    company: vars.company?.trim() || "",
    email: vars.email?.trim() || "",
  };
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => map[k] ?? "");
}
