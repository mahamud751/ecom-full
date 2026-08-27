"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import {
  PageHeader,
  AdminCard,
  Btn,
  Input,
  Select,
  Modal,
  Badge,
  Empty,
} from "@/components/admin/ui";
import { Loader2, Plus } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<
    {
      id: string;
      code: string;
      type: string;
      value: number;
      minOrder: number;
      usedCount: number;
      usageLimit: number | null;
      isActive: boolean;
      description: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT",
    value: "10",
    minOrder: "0",
    description: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const d = await adminFetch("/admin/coupons").then((r) => r.json());
    setCoupons(d.coupons || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    await adminFetch("/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder),
        description: form.description,
      }),
    });
    setModal(false);
    setForm({ code: "", type: "PERCENT", value: "10", minOrder: "0", description: "" });
    void load();
  }

  async function toggle(id: string, isActive: boolean) {
    await adminFetch("/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    void load();
  }

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle="Promo codes for checkout discount"
        actions={
          <Btn onClick={() => setModal(true)}>
            <Plus className="h-3.5 w-3.5" /> New coupon
          </Btn>
        }
      />
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
        </div>
      ) : coupons.length === 0 ? (
        <Empty text="No coupons yet" />
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <AdminCard key={c.id} className="!p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-lg font-bold">{c.code}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {c.type === "PERCENT" ? `${c.value}%` : `৳${c.value}`} off ·
                    min ৳{c.minOrder} · used {c.usedCount}
                    {c.usageLimit != null ? `/${c.usageLimit}` : ""}
                  </p>
                </div>
                <button type="button" onClick={() => toggle(c.id, c.isActive)}>
                  <Badge tone={c.isActive ? "green" : "gray"}>
                    {c.isActive ? "Active" : "Off"}
                  </Badge>
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Create coupon">
        <div className="space-y-3">
          <Input
            label="Code"
            value={form.code}
            onChange={(e) =>
              setForm({ ...form, code: e.target.value.toUpperCase() })
            }
            placeholder="CHOLBE10"
          />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="PERCENT">Percent %</option>
            <option value="FIXED">Fixed ৳</option>
          </Select>
          <Input
            label="Value"
            type="number"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
          <Input
            label="Min order ৳"
            type="number"
            value={form.minOrder}
            onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setModal(false)}>
            Cancel
          </Btn>
          <Btn onClick={create} disabled={!form.code}>
            Create
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
