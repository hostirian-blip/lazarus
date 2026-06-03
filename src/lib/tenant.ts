// Tenant scoping — the single seam through which tenant-owned data is accessed.
//
// Non-negotiable rule (CLAUDE.md): every query scopes to tenantId; never leak
// data across tenants. Rather than hand-threading `where: { tenantId }` into
// every call site (easy to forget), feature code should obtain a scoped client
// via `tenantDb(tenantId)` and let it inject the tenant filter automatically.
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Read the session or redirect to /login. Use in protected server components. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  return session;
}

/** The current tenant id, or redirect to /login. */
export async function requireTenantId(): Promise<string> {
  const session = await requireSession();
  return session.user.tenantId;
}

/**
 * Returns a thin, tenant-scoped data client. Every read auto-applies
 * `where: { tenantId }`; every create auto-injects `tenantId`. Callers cannot
 * accidentally query another tenant's rows through this surface.
 */
export function tenantDb(tenantId: string) {
  return {
    tenantId,

    lead: {
      findMany: (args: Prisma.LeadFindManyArgs = {}) =>
        db.lead.findMany({ ...args, where: { ...args.where, tenantId } }),
      findFirst: (args: Prisma.LeadFindFirstArgs = {}) =>
        db.lead.findFirst({ ...args, where: { ...args.where, tenantId } }),
      count: (args: Prisma.LeadCountArgs = {}) =>
        db.lead.count({ ...args, where: { ...args.where, tenantId } }),
      create: (data: Omit<Prisma.LeadUncheckedCreateInput, "tenantId">) =>
        db.lead.create({ data: { ...data, tenantId } }),
      updateMany: (args: Prisma.LeadUpdateManyArgs) =>
        db.lead.updateMany({ ...args, where: { ...args.where, tenantId } }),
    },

    campaign: {
      findMany: (args: Prisma.CampaignFindManyArgs = {}) =>
        db.campaign.findMany({ ...args, where: { ...args.where, tenantId } }),
      count: (args: Prisma.CampaignCountArgs = {}) =>
        db.campaign.count({ ...args, where: { ...args.where, tenantId } }),
      create: (data: Omit<Prisma.CampaignUncheckedCreateInput, "tenantId">) =>
        db.campaign.create({ data: { ...data, tenantId } }),
    },

    /** The tenant record itself. */
    tenant: () => db.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
  };
}

export type TenantDb = ReturnType<typeof tenantDb>;
