import { apiServer, ApiClientError } from "@/lib/api-client";

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
  /** Flagged as emergency/instant-capable */
  isEmergency: boolean;
  /** Can take instant emergency right now (online + emergency) */
  emergencyAvailable: boolean;
  /** Online and in schedule (or emergency online) */
  availableNow: boolean;
  scheduleSummary: string;
  nextSlots: {
    iso: string;
    label: string;
    dateLabel: string;
    timeLabel: string;
  }[];
};

export type DoctorSchedule = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMins: number;
  isActive: boolean;
};

export type DoctorDetail = DoctorCard & {
  schedules: DoctorSchedule[];
};

export async function listDoctors(opts?: {
  specialty?: string;
  q?: string;
  availableOnly?: boolean;
  emergencyOnly?: boolean;
}): Promise<DoctorCard[]> {
  const params = new URLSearchParams();
  if (opts?.specialty) params.set("specialty", opts.specialty);
  if (opts?.q) params.set("q", opts.q);
  if (opts?.availableOnly) params.set("available", "1");
  if (opts?.emergencyOnly) params.set("emergency", "1");
  const qs = params.toString();
  const data = await apiServer<{ doctors: DoctorCard[] }>(
    `/doctors${qs ? `?${qs}` : ""}`,
  );
  return data.doctors;
}

export async function getDoctorBySlug(
  slug: string,
): Promise<DoctorDetail | null> {
  try {
    const data = await apiServer<{ doctor: DoctorDetail }>(
      `/doctors/${encodeURIComponent(slug)}`,
    );
    return data.doctor;
  } catch (e) {
    if (e instanceof ApiClientError && e.status === 404) return null;
    throw e;
  }
}

export const SPECIALTIES = [
  "All",
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "Gynecologist",
  "Orthopedic",
  "ENT",
  "Psychiatrist",
  "Neurologist",
  "Diabetologist",
] as const;
