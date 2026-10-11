import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.adminUser.findMany({ select: { email: true, name: true, role: true } });
  console.log("=== Admin Users ===");
  admins.forEach(a => console.log(`${a.email} | ${a.name} | ${a.role}`));

  const users = await prisma.customer.findMany({ select: { email: true, name: true, phone: true } });
  console.log(`\n=== Customers (User) === ${users.length} records`);
  users.slice(0, 10).forEach(u => console.log(`${u.email} | ${u.name} | ${u.phone}`));

  const doctors = await prisma.doctor.findMany({ select: { email: true, name: true } });
  console.log(`\n=== Doctors === ${doctors.length} records`);
  doctors.slice(0, 15).forEach(d => console.log(`${d.email} | ${d.name}`));

  const riders = await prisma.rider.findMany({ select: { phone: true, name: true } });
  console.log(`\n=== Riders === ${riders.length} records`);
  riders.slice(0, 5).forEach(r => console.log(`${r.phone} | ${r.name}`));

  const vendors = await prisma.vendor.findMany({ select: { name: true, email: true } });
  console.log(`\n=== Vendors === ${vendors.length} records`);
  vendors.forEach(v => console.log(`${v.email} | ${v.name}`));
}

main().finally(() => prisma.$disconnect());
