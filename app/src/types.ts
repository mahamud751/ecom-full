/** Shared API shapes (mirrors the NestJS backend DTOs) */

export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  addresses?: unknown[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  hub?: string | null;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

export type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  cta?: string | null;
  link?: string | null;
};

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  price: number;
  comparePrice?: number | null;
  stock: number;
  rating?: number | null;
  reviewCount?: number;
  requiresPrescription?: boolean;
  expressDelivery?: boolean;
  discountBadge?: string | null;
  category?: { name: string; slug: string } | null;
  brand?: { name: string; slug: string } | null;
};

export type Variant = {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku?: string | null;
  isDefault?: boolean;
};

export type ProductDetail = ProductCard & {
  description?: string | null;
  genericName?: string | null;
  images?: string[];
  variants?: Variant[];
  category?: Category | null;
  hub?: string | null;
};

export type DoctorCard = {
  id: string;
  name: string;
  slug: string;
  specialty: string;
  designation?: string | null;
  image?: string | null;
  rating?: number | null;
  patients?: string | null;
  experience?: number | null;
  hospital?: string | null;
  fee: number;
  emergencyFee?: number | null;
  isOnline?: boolean;
  isEmergency?: boolean;
  emergencyAvailable?: boolean;
  availableNow?: boolean;
  scheduleSummary?: string | null;
};

export type DoctorDetail = DoctorCard & {
  bio?: string | null;
  education?: string | null;
  languages?: string | null;
  bmdcNumber?: string | null;
  schedules?: { day: string; slots: string[] }[];
  nextSlots?: {
    iso: string;
    label: string;
    dateLabel?: string;
    timeLabel?: string;
  }[];
};

export type LabTest = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  description?: string | null;
};

export type LabPackage = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  description?: string | null;
  reportHours?: number | null;
  tests?: { name: string }[];
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image?: string | null;
  price: number;
  qty: number;
  stock: number;
  variantId?: string | null;
  variantName?: string | null;
};

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PACKAGING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type ConsultStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';
