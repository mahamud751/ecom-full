import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  buildUpcomingSlots,
  formatScheduleSummary,
  isWithinScheduleNow,
  type ScheduleRow,
} from "./schedule";

export type DoctorCard = {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  image: string;
  experience: number;
  fee: number;
  emergencyFee: number | null;
  rating: number;
  patients: string;
  hospital: string | null;
  languages: string;
  bio: string | null;
  bmdcNumber: string | null;
  isOnline: boolean;
  isEmergency: boolean;
  emergencyAvailable: boolean;
  availableNow: boolean;
  scheduleSummary: string;
  nextSlots: {
    iso: string;
    label: string;
    dateLabel: string;
    timeLabel: string;
  }[];
};

function toScheduleRows(
  schedules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotMins: number;
    isActive: boolean;
  }[],
): ScheduleRow[] {
  return schedules.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    slotMins: s.slotMins,
    isActive: s.isActive,
  }));
}

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async listDoctors(opts?: {
    specialty?: string;
    q?: string;
    availableOnly?: boolean;
    emergencyOnly?: boolean;
  }): Promise<DoctorCard[]> {
    const where: Record<string, unknown> = { isActive: true };

    if (opts?.emergencyOnly) where.isEmergency = true;
    if (opts?.specialty && opts.specialty !== "All") {
      where.specialty = opts.specialty;
    }
    if (opts?.q?.trim()) {
      const q = opts.q.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { specialty: { contains: q, mode: "insensitive" } },
      ];
    }

    const doctors = await this.prisma.doctor.findMany({
      where: where as never,
      include: { schedules: true },
      orderBy: [
        { isEmergency: "desc" },
        { isOnline: "desc" },
        { rating: "desc" },
        { name: "asc" },
      ],
    });

    const cards = doctors.map((d) => {
      const schedules = toScheduleRows(d.schedules);
      const inHours = isWithinScheduleNow(schedules);
      const emergencyAvailable = d.isEmergency && d.isOnline;
      const availableNow = d.isEmergency
        ? emergencyAvailable
        : d.isOnline && inHours;
      const nextSlots = buildUpcomingSlots(schedules, {
        daysAhead: 5,
        maxSlots: 8,
      });

      return {
        id: d.id,
        slug: d.slug,
        name: d.name,
        specialty: d.specialty,
        image: d.image,
        experience: d.experience,
        fee: d.fee,
        emergencyFee: d.emergencyFee,
        rating: d.rating,
        patients: d.patients,
        hospital: d.hospital,
        languages: d.languages,
        bio: d.bio,
        bmdcNumber: d.bmdcNumber,
        isOnline: d.isOnline,
        isEmergency: d.isEmergency,
        emergencyAvailable,
        availableNow,
        scheduleSummary: formatScheduleSummary(schedules),
        nextSlots,
      } satisfies DoctorCard;
    });

    if (opts?.availableOnly) {
      return cards.filter((c) => c.availableNow);
    }
    return cards;
  }

  async getDoctorBySlug(slug: string) {
    const d = await this.prisma.doctor.findUnique({
      where: { slug },
      include: { schedules: { orderBy: { dayOfWeek: "asc" } } },
    });
    if (!d || !d.isActive) {
      throw new NotFoundException("Doctor not found");
    }

    const schedules = toScheduleRows(d.schedules);

    // Occupied slots for this doctor in next 7 days
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 7);
    const booked = await this.prisma.consultation.findMany({
      where: {
        doctorId: d.id,
        scheduledAt: { gte: from, lte: to },
        status: { in: ["PENDING", "CONFIRMED", "IN_CALL"] },
      },
      select: { scheduledAt: true },
    });
    const occupiedIsos = booked
      .filter((b) => b.scheduledAt)
      .map((b) => b.scheduledAt!.toISOString());

    const nextSlots = buildUpcomingSlots(schedules, {
      daysAhead: 7,
      maxSlots: 48,
      occupiedIsos,
    });

    const emergencyAvailable = d.isEmergency && d.isOnline;
    const availableNow = d.isEmergency
      ? emergencyAvailable
      : d.isOnline && isWithinScheduleNow(schedules);

    return {
      id: d.id,
      slug: d.slug,
      name: d.name,
      specialty: d.specialty,
      image: d.image,
      experience: d.experience,
      fee: d.fee,
      emergencyFee: d.emergencyFee,
      rating: d.rating,
      patients: d.patients,
      hospital: d.hospital,
      languages: d.languages,
      bio: d.bio,
      bmdcNumber: d.bmdcNumber,
      isOnline: d.isOnline,
      isEmergency: d.isEmergency,
      emergencyAvailable,
      availableNow,
      scheduleSummary: formatScheduleSummary(schedules),
      schedules: d.schedules,
      nextSlots,
    };
  }

  /** Doctor toggles online status from portal */
  async toggleOnline(doctorId: string, isOnline: boolean) {
    const updated = await this.prisma.doctor.update({
      where: { id: doctorId },
      data: { isOnline },
    });
    return { success: true, isOnline: updated.isOnline };
  }
}
