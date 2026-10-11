import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  // Pick a doctor to be the emergency doctor (e.g., Dr. Karim Hossain - General Medicine)
  const doctor = await prisma.doctor.findFirst({ where: { slug: "dr-karim-hossain" } });
  if (!doctor) {
    console.log("dr-karim-hossain not found. Available doctors:");
    const all = await prisma.doctor.findMany({ select: { slug: true, name: true, specialty: true } });
    all.forEach(d => console.log(`  ${d.slug} - ${d.name} (${d.specialty})`));
    return;
  }

  const hash = await bcrypt.hash("emergency123", 10);
  const updated = await prisma.doctor.update({
    where: { id: doctor.id },
    data: {
      email: "emergency@ahona.store",
      password: hash,
      isEmergency: true,
      isOnline: true,
      emergencyFee: 800, // Tk
    },
  });

  console.log("✓ Emergency doctor configured:");
  console.log(`  Name:      ${updated.name}`);
  console.log(`  Specialty: ${updated.specialty}`);
  console.log(`  Email:     ${updated.email}`);
  console.log(`  Password:  emergency123`);
  console.log(`  Online:    ${updated.isOnline}`);
  console.log(`  Emergency: ${updated.isEmergency}`);
  console.log(`  Regular fee: ৳${updated.fee} | Emergency fee: ৳${updated.emergencyFee}`);
  console.log("");
  console.log("Doctor portal: https://ahona.store/doctor-portal");
}

main().finally(() => prisma.$disconnect());
