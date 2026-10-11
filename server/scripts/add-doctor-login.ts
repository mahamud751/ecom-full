import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("doctor123", 10);
  // Give the first doctor portal login credentials
  const doctor = await prisma.doctor.findFirst({
    where: { slug: "dr-sadia-rahman" },
    select: { id: true, name: true, slug: true },
  });
  if (!doctor) {
    console.log("Doctor dr-sadia-rahman not found");
    return;
  }
  await prisma.doctor.update({
    where: { id: doctor.id },
    data: { email: "sadia@ahona.store", password: hash },
  });
  console.log(`✓ ${doctor.name} (slug: ${doctor.slug}) -> sadia@ahona.store / doctor123`);
}

main().finally(() => prisma.$disconnect());
