"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import Link from "next/link";
import {
  PageHeader,
  AdminCard,
  Btn,
  Input,
  Select,
  Modal,
  Badge,
  Empty,
  StatCard,
  Textarea,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import { Loader2, Plus, Pencil } from "lucide-react";

type Rider = {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  zone: string | null;
  nid: string | null;
  address: string | null;
  perDelivery: number;
  notes: string | null;
  isOnline: boolean;
  status: string;
  isActive: boolean;
  deliveredCount: number;
  activeCount: number;
  earnings: number;
  _count: { orders: number };
  orders: { orderNumber: string; status: string }[];
};

const emptyForm = {
  name: "",
  phone: "",
  vehicleType: "Bike",
  zone: "Dhaka",
  nid: "",
  address: "",
  perDelivery: "40",
  notes: "",
  isOnline: true,
};

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Rider | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await adminFetch("/admin/riders").then((r) => r.json());
    setRiders(d.riders || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  }

  function openEdit(r: Rider) {
    setEditing(r);
    setForm({
      name: r.name,
      phone: r.phone,
      vehicleType: r.vehicleType,
      zone: r.zone || "",
      nid: r.nid || "",
      address: r.address || "",
      perDelivery: String(r.perDelivery ?? 40),
      notes: r.notes || "",
      isOnline: r.isOnline,
    });
    setModal(true);
  }

  async function save() {
    setSaving(true);
    const payload = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name,
      phone: form.phone,
      vehicleType: form.vehicleType,
      zone: form.zone || null,
      nid: form.nid || null,
      address: form.address || null,
      perDelivery: Number(form.perDelivery),
      notes: form.notes || null,
      isOnline: form.isOnline,
    };
    const res = await adminFetch("/admin/riders", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setModal(false);
      void load();
    } else {
      const d = await res.json();
      alert(d.error || "Failed");
    }
  }

  async function patch(id: string, data: Record<string, unknown>) {
    await adminFetch("/admin/riders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    void load();
  }

  const online = riders.filter(
    (r) => r.isOnline && r.status === "AVAILABLE"
  ).length;
  const busy = riders.filter((r) => r.status === "BUSY").length;
  const totalEarn = riders.reduce((s, r) => s + (r.earnings || 0), 0);

  return (
    <div>
      <PageHeader
        title="Riders & operations"
        subtitle="Fleet, zones, payouts per delivery, live assignments"
        actions={
          <Btn onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Add rider
          </Btn>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Fleet" value={riders.length} />
        <StatCard label="Available now" value={online} accent="bg-emerald-500" />
        <StatCard label="Busy" value={busy} accent="bg-amber-500" />
        <StatCard
          label="Rider earnings"
          value={formatPrice(totalEarn)}
          hint="From delivered orders"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
        </div>
      ) : riders.length === 0 ? (
        <Empty text="No riders — add delivery partners" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {riders.map((r) => (
            <AdminCard key={r.id}>
              <div className="flex justify-between gap-2">
                <div>
                  <h3 className="font-bold">{r.name}</h3>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {r.phone} · {r.vehicleType}
                    {r.zone ? ` · ${r.zone}` : ""}
                  </p>
                  {!r.isActive && <Badge tone="gray">Inactive</Badge>}
                </div>
                <Badge
                  tone={
                    r.status === "AVAILABLE"
                      ? "green"
                      : r.status === "BUSY"
                        ? "amber"
                        : "gray"
                  }
                >
                  {r.status}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[var(--ivory)] p-2 text-center text-[10px]">
                <div>
                  <p className="text-sm font-bold">{r._count.orders}</p>
                  <p className="text-[var(--ink-muted)]">Orders</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{r.deliveredCount}</p>
                  <p className="text-[var(--ink-muted)]">Delivered</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-700">
                    {formatPrice(r.earnings || 0)}
                  </p>
                  <p className="text-[var(--ink-muted)]">Earned</p>
                </div>
              </div>

              <p className="mt-2 text-[10px] text-[var(--ink-muted)]">
                Payout ৳{r.perDelivery}/delivery
                {r.activeCount > 0 ? ` · ${r.activeCount} active` : ""}
              </p>
              {r.orders.length > 0 && (
                <p className="mt-1 truncate text-[10px] text-[var(--ink-muted)]">
                  Recent:{" "}
                  {r.orders
                    .slice(0, 3)
                    .map((o) => o.orderNumber)
                    .join(", ")}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Btn variant="secondary" onClick={() => openEdit(r)}>
                  <Pencil className="h-3 w-3" /> Edit
                </Btn>
                <Btn
                  variant="ghost"
                  onClick={() => patch(r.id, { isOnline: !r.isOnline })}
                >
                  {r.isOnline ? "Offline" : "Online"}
                </Btn>
                <Select
                  value={r.status}
                  onChange={(e) => patch(r.id, { status: e.target.value })}
                  className="w-auto text-xs"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="BUSY">BUSY</option>
                  <option value="OFFLINE">OFFLINE</option>
                </Select>
                <Link href={`/admin/riders/${r.id}`}>
                  <Btn>Details</Btn>
                </Link>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit rider" : "New rider"}
        wide
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Phone *"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Select
            label="Vehicle"
            value={form.vehicleType}
            onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
          >
            <option value="Bike">Bike</option>
            <option value="Cycle">Cycle</option>
            <option value="Van">Van</option>
            <option value="Car">Car</option>
          </Select>
          <Input
            label="Zone"
            value={form.zone}
            onChange={(e) => setForm({ ...form, zone: e.target.value })}
          />
          <Input
            label="NID"
            value={form.nid}
            onChange={(e) => setForm({ ...form, nid: e.target.value })}
          />
          <Input
            label="Payout per delivery (৳)"
            type="number"
            value={form.perDelivery}
            onChange={(e) =>
              setForm({ ...form, perDelivery: e.target.value })
            }
          />
          <div className="sm:col-span-2">
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={form.isOnline}
              onChange={(e) =>
                setForm({ ...form, isOnline: e.target.checked })
              }
            />
            Online / available for dispatch
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setModal(false)}>
            Cancel
          </Btn>
          <Btn
            onClick={save}
            disabled={saving || !form.name || !form.phone}
          >
            {saving ? "Saving…" : "Save rider"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
