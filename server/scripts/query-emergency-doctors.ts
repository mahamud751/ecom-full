import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const docs = await prisma.doctor.findMany({
    where: { isEmergency: true },
    select: { id: true, slug: true, name: true, specialty: true, email: true, password: true, isOnline: true, fee: true, emergencyFee: true },
  });
  console.log(`Emergency doctors: ${docs.length}`);
  docs.forEach(d => {
    const hasLogin = !!(d.email && d.password);
    console.log(`  ${d.name} | ${d.specialty} | email: ${d.email ?? "(none)"} | password: ${d.password ? "(set)" : "(none)"} | online: ${d.isOnline} | fee: ${d.fee} | emergencyFee: ${d.emergencyFee}`);
  });
}
main().finally(() => prisma.$disconnect());
