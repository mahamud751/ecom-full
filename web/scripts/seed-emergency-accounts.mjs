/**
 * Seed emergency doctor + test patient for consultation flows.
 * Run: node scripts/seed-emergency-accounts.mjs
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMERGENCY_EMAIL = "emergency.doctor@cholbe.com";
const EMERGENCY_PASS = "Emergency@123";
const NORMAL_DOC_EMAIL = "dr.sadia@cholbe.com";
const NORMAL_DOC_PASS = "Doctor@123";
const PATIENT_EMAIL = "patient.test@cholbe.com";
const PATIENT_PASS = "Patient@123";

const U = "https://images.unsplash.com";

async function main() {
  const emergencyHash = await bcrypt.hash(EMERGENCY_PASS, 10);
  const doctorHash = await bcrypt.hash(NORMAL_DOC_PASS, 10);
  const patientHash = await bcrypt.hash(PATIENT_PASS, 10);

  const emergency = await prisma.doctor.upsert({
    where: { slug: "dr-emergency-unit" },
    update: {
      name: "Dr. Rafiq Hasan (Emergency)",
      specialty: "Emergency Medicine",
      email: EMERGENCY_EMAIL,
      password: emergencyHash,
      isEmergency: true,
      isOnline: true,
      isActive: true,
      fee: 399,
      emergencyFee: 499,
      experience: 15,
      rating: 4.9,
      patients: "12k+",
      hospital: "Cholbe Emergency Care, Dhaka",
      languages: "Bangla, English",
      bio: "24/7 emergency GP for fever, injury, acute pain, chest discomfort triage. Instant video/audio when online.",
      bmdcNumber: "A-EM-9001",
      phone: "01711000099",
      image: `${U}/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&h=920&q=90`,
    },
    create: {
      slug: "dr-emergency-unit",
      name: "Dr. Rafiq Hasan (Emergency)",
      specialty: "Emergency Medicine",
      email: EMERGENCY_EMAIL,
      password: emergencyHash,
      isEmergency: true,
      isOnline: true,
      isActive: true,
      fee: 399,
      emergencyFee: 499,
      experience: 15,
      rating: 4.9,
      patients: "12k+",
      hospital: "Cholbe Emergency Care, Dhaka",
      languages: "Bangla, English",
      bio: "24/7 emergency GP for fever, injury, acute pain, chest discomfort triage. Instant video/audio when online.",
      bmdcNumber: "A-EM-9001",
      phone: "01711000099",
      image: `${U}/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&h=920&q=90`,
    },
  });

  // Always-on schedule for emergency (backup if needed)
  await prisma.doctorSchedule.deleteMany({ where: { doctorId: emergency.id } });
  for (let day = 0; day < 7; day++) {
    await prisma.doctorSchedule.create({
      data: {
        doctorId: emergency.id,
        dayOfWeek: day,
        startTime: "00:00",
        endTime: "23:59",
        slotMins: 15,
        isActive: true,
      },
    });
  }

  // Give normal GP a portal login if exists
  const sadia = await prisma.doctor.findUnique({
    where: { slug: "dr-sadia-rahman" },
  });
  if (sadia) {
    await prisma.doctor.update({
      where: { id: sadia.id },
      data: {
        email: NORMAL_DOC_EMAIL,
        password: doctorHash,
        isEmergency: false,
        isOnline: true,
      },
    });
  }

  // Second emergency doctor (backup)
  await prisma.doctor.upsert({
    where: { slug: "dr-emergency-nisha" },
    update: {
      email: "emergency.nisha@cholbe.com",
      password: emergencyHash,
      isEmergency: true,
      isOnline: true,
      isActive: true,
      emergencyFee: 449,
    },
    create: {
      slug: "dr-emergency-nisha",
      name: "Dr. Nisha Akter (Emergency)",
      specialty: "Emergency Medicine",
      email: "emergency.nisha@cholbe.com",
      password: emergencyHash,
      isEmergency: true,
      isOnline: true,
      isActive: true,
      fee: 349,
      emergencyFee: 449,
      experience: 9,
      rating: 4.8,
      patients: "6.1k+",
      hospital: "Cholbe Emergency Care, Dhaka",
      languages: "Bangla, English",
      bio: "Emergency physician — acute illness, pediatric fever, women's urgent care.",
      bmdcNumber: "A-EM-9002",
      phone: "01711000088",
      image: `${U}/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=800&h=920&q=90`,
    },
  });

  const patient = await prisma.customer.upsert({
    where: { email: PATIENT_EMAIL },
    update: {
      password: patientHash,
      name: "Test Patient",
      phone: "01712345678",
      city: "Dhaka",
      area: "Gulshan",
      address: "House 12, Road 5, Gulshan-1",
      isActive: true,
    },
    create: {
      email: PATIENT_EMAIL,
      password: patientHash,
      name: "Test Patient",
      phone: "01712345678",
      city: "Dhaka",
      area: "Gulshan",
      address: "House 12, Road 5, Gulshan-1",
      gender: "male",
      isActive: true,
    },
  });

  console.log("\n=== Cholbe test accounts ready ===\n");
  console.log("EMERGENCY DOCTOR (instant consult desk)");
  console.log("  Portal:  /doctor-portal");
  console.log("  Email:   " + EMERGENCY_EMAIL);
  console.log("  Password:" + EMERGENCY_PASS);
  console.log("  Profile: /doctors/dr-emergency-unit");
  console.log("");
  console.log("EMERGENCY DOCTOR #2");
  console.log("  Email:   emergency.nisha@cholbe.com");
  console.log("  Password:" + EMERGENCY_PASS);
  console.log("");
  console.log("NORMAL DOCTOR (schedule required)");
  console.log("  Portal:  /doctor-portal");
  console.log("  Email:   " + NORMAL_DOC_EMAIL);
  console.log("  Password:" + NORMAL_DOC_PASS);
  console.log("");
  console.log("TEST PATIENT (storefront user)");
  console.log("  Sign-in: site header modal");
  console.log("  Email:   " + PATIENT_EMAIL);
  console.log("  Password:" + PATIENT_PASS);
  console.log("  Phone:   01712345678");
  console.log("");
  console.log("Flow:");
  console.log("  1) Login emergency doctor → Go Online");
  console.log("  2) Patient opens /doctors → Emergency section → Instant video");
  console.log("  3) Doctor sees Emergency queue → Join call");
  console.log("  4) Normal doctors: book slot only (no instant)");
  console.log("");
  console.log("IDs:", { emergency: emergency.id, patient: patient.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
