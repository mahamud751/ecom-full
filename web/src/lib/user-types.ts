/** Shared client/server user shape (no server imports). */

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
  postalCode: string | null;
  createdAt: string;
  lastLoginAt: string | null;
};
