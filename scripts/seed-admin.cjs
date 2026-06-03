/* One-off: seed/refresh the platform admin user.
 * Password is supplied via the ADMIN_PW env var and is NEVER hardcoded or logged.
 *   ADMIN_PW='...' node scripts/seed-admin.cjs
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "kenpcox@gmail.com").toLowerCase();
  const password = process.env.ADMIN_PW;
  if (!password) throw new Error("ADMIN_PW env var is required");

  const passwordHash = await bcrypt.hash(password, 12);

  // The admin belongs to a dedicated tenant (User.tenantId is required).
  let tenant = await db.tenant.findFirst({ where: { name: "Lazarus Admin" } });
  if (!tenant) tenant = await db.tenant.create({ data: { name: "Lazarus Admin" } });

  const user = await db.user.upsert({
    where: { email },
    update: { role: "admin", passwordHash, tenantId: tenant.id },
    create: { email, name: "Ken Cox", role: "admin", passwordHash, tenantId: tenant.id },
  });

  console.log(`admin ready: ${user.email} (role=${user.role}, tenant=${tenant.id})`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
