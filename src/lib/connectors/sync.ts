// Pull leads from a connected CRM and upsert them as tenant Lead rows.
// Dedupe by crmId, normalized phone, or email. Phones normalized to E.164.
import type { Prisma } from "@prisma/client";
import type { CrmConnector } from "./types";
import type { TenantDb } from "@/lib/tenant";
import { toE164 } from "@/lib/phone";

export interface SyncResult {
  pulled: number;
  created: number;
  duplicates: number;
  pages: number;
}

export async function syncLeads(
  scoped: TenantDb,
  connector: CrmConnector,
  maxPages = 20,
): Promise<SyncResult> {
  const result: SyncResult = { pulled: 0, created: 0, duplicates: 0, pages: 0 };
  let cursor: string | undefined;

  do {
    const { leads, nextCursor } = await connector.pullLeads({ cursor });
    result.pages++;
    for (const l of leads) {
      result.pulled++;
      const phoneE164 = l.phone ? toE164(l.phone) : null;
      const email = l.email ? l.email.toLowerCase() : null;

      const or: Prisma.LeadWhereInput[] = [{ crmId: l.crmId }];
      if (phoneE164) or.push({ phoneE164 });
      if (email) or.push({ email });

      const existing = await scoped.lead.findFirst({ where: { OR: or }, select: { id: true } });
      if (existing) {
        result.duplicates++;
        continue;
      }
      await scoped.lead.create({
        crmId: l.crmId,
        firstName: l.firstName ?? undefined,
        lastName: l.lastName ?? undefined,
        email: email ?? undefined,
        phoneE164: phoneE164 ?? undefined,
        company: l.company ?? undefined,
      });
      result.created++;
    }
    cursor = nextCursor;
  } while (cursor && result.pages < maxPages);

  return result;
}
