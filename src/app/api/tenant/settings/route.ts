// POST /api/tenant/settings — update the caller's tenant settings (CMS).
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Body = z.object({
  brandVoice: z.string().max(2000).optional(),
  emailSender: z.union([z.string().email(), z.literal("")]).optional(),
  twilioNumber: z.string().max(120).optional(),
  researchEnabled: z.boolean().optional(),
  researchRolloutPct: z.number().int().min(0).max(100).optional(),
  researchMonthlyCapCents: z.number().int().min(0).optional(),
  twilioAccountSid: z.string().max(120).optional(),
  smtpHost: z.string().max(255).optional(),
  smtpPort: z.number().int().min(0).max(65535).optional(),
  smtpUser: z.string().max(255).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  const data: Prisma.TenantUpdateInput = {};
  if (d.brandVoice !== undefined) data.brandVoice = d.brandVoice || null;
  if (d.emailSender !== undefined) data.emailSender = d.emailSender || null;
  if (d.twilioNumber !== undefined) data.twilioNumber = d.twilioNumber || null;
  if (d.researchEnabled !== undefined) data.researchEnabled = d.researchEnabled;
  if (d.researchRolloutPct !== undefined) data.researchRolloutPct = d.researchRolloutPct;
  if (d.researchMonthlyCapCents !== undefined) data.researchMonthlyCap = d.researchMonthlyCapCents;
  if (d.twilioAccountSid !== undefined) data.twilioAccountSid = d.twilioAccountSid || null;
  if (d.smtpHost !== undefined) data.smtpHost = d.smtpHost || null;
  if (d.smtpPort !== undefined) data.smtpPort = d.smtpPort || null;
  if (d.smtpUser !== undefined) data.smtpUser = d.smtpUser || null;

  await db.tenant.update({ where: { id: session.user.tenantId }, data });
  return NextResponse.json({ ok: true });
}
