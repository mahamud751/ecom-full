"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import Image from "next/image";
import { Camera, Loader2, Save, Lock } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/components/ui/Toast";

export default function AccountProfilePage() {
  const { user, setUser, refresh } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    city: "Dhaka",
    area: "",
    postalCode: "",
    avatarUrl: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: user.name || "",
      phone: user.phone || "",
      gender: user.gender || "",
      dateOfBirth: user.dateOfBirth || "",
      address: user.address || "",
      city: user.city || "Dhaka",
      area: user.area || "",
      postalCode: user.postalCode || "",
      avatarUrl: user.avatarUrl || "",
    }));
  }, [user]);

  if (!user) return null;

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onAvatar(file?: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "avatars");
      const res = await apiFetch("/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      update("avatarUrl", data.url);
      toast("Photo uploaded — save profile to apply", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "info");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      toast("New passwords do not match", "info");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, string | null> = {
        name: form.name,
        phone: form.phone,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        address: form.address,
        city: form.city,
        area: form.area,
        postalCode: form.postalCode,
        avatarUrl: form.avatarUrl,
      };
      if (form.newPassword) {
        body.currentPassword = form.currentPassword;
        body.newPassword = form.newPassword;
      }
      const res = await apiFetch("/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setUser(data.user);
      await refresh();
      update("currentPassword", "");
      update("newPassword", "");
      update("confirmPassword", "");
      toast("Profile updated", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "info");
    } finally {
      setLoading(false);
    }
  }

  const initial = form.name.charAt(0).toUpperCase() || "U";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">Edit profile</h2>

      {/* Avatar */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--ink-muted)]">
          Profile photo
        </h3>
        <div className="flex flex-wrap items-center gap-5">
          <span className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-[var(--forest-deep)] text-3xl font-bold text-[var(--gold)]">
            {form.avatarUrl ? (
              <Image
                src={form.avatarUrl}
                alt="Avatar"
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              initial
            )}
          </span>
          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--ivory)] px-4 py-2.5 text-sm font-bold hover:border-[var(--forest)]">
              <Camera className="h-4 w-4" />
              {uploading ? "Uploading…" : "Upload photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => void onAvatar(e.target.files?.[0])}
              />
            </label>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              JPG, PNG or WebP · max 6MB
            </p>
          </div>
        </div>
      </section>

      {/* Personal */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--ink-muted)]">
          Personal details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold">Full name</span>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--forest)] focus:ring-4 focus:ring-[var(--forest)]/10"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">Email</span>
            <input
              disabled
              value={user.email}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--ivory)] px-4 py-3 text-sm text-[var(--ink-muted)]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">Phone</span>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--forest)]"
              placeholder="01XXXXXXXXX"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">Gender</span>
            <select
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--forest)]"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">
              Date of birth
            </span>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--forest)]"
            />
          </label>
        </div>
      </section>

      {/* Address */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--ink-muted)]">
          Delivery address
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold">
              Full address
            </span>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="w-full resize-none rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--forest)]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">City</span>
            <input
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--forest)]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">Area</span>
            <input
              value={form.area}
              onChange={(e) => update("area", e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--forest)]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">
              Postal code
            </span>
            <input
              value={form.postalCode}
              onChange={(e) => update("postalCode", e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--forest)]"
            />
          </label>
        </div>
      </section>

      {/* Password */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--ink-muted)]">
          <Lock className="h-4 w-4" />
          Change password
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">
              Current password
            </span>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => update("currentPassword", e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--forest)]"
              autoComplete="current-password"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">
              New password
            </span>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => update("newPassword", e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--forest)]"
              autoComplete="new-password"
              minLength={6}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">
              Confirm new
            </span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--forest)]"
              autoComplete="new-password"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-[var(--ink-muted)]">
          Leave blank to keep your current password.
        </p>
      </section>

      <button
        type="submit"
        disabled={loading || uploading}
        className="flex items-center justify-center gap-2 rounded-full bg-[var(--forest-deep)] px-8 py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save changes
      </button>
    </form>
  );
}
