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

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<
    {
      id: string;
      name: string;
      phone: string;
      email: string | null;
      city: string;
      status: string;
      commissionRate: number;
      tradeLicense: string | null;
      _count: { products: number; orders: number };
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Dhaka",
    commissionRate: "10",
    tradeLicense: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const d = await adminFetch("/admin/vendors").then((r) => r.json());
    setVendors(d.vendors || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    await adminFetch("/admin/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        commissionRate: Number(form.commissionRate),
        status: "ACTIVE",
      }),
    });
    setModal(false);
    setForm({
      name: "",
      phone: "",
      email: "",
      city: "Dhaka",
      commissionRate: "10",
      tradeLicense: "",
    });
    void load();
  }

  async function setStatus(id: string, status: string) {
    await adminFetch("/admin/vendors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    void load();
  }

  return (
    <div>
      <PageHeader
        title="Vendors (B2B)"
        subtitle="Seller partners, commission & product supply"
        actions={
          <Btn onClick={() => setModal(true)}>
            <Plus className="h-3.5 w-3.5" /> Add vendor
          </Btn>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
        </div>
      ) : vendors.length === 0 ? (
        <Empty text="No vendors yet — onboard first partner" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {vendors.map((v) => (
            <AdminCard key={v.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold">{v.name}</h3>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {v.phone}
                    {v.email ? ` · ${v.email}` : ""} · {v.city}
                  </p>
                  {v.tradeLicense && (
                    <p className="text-[10px] text-[var(--ink-muted)]">
                      License: {v.tradeLicense}
                    </p>
                  )}
                </div>
                <Badge
                  tone={
                    v.status === "ACTIVE"
                      ? "green"
                      : v.status === "SUSPENDED"
                        ? "red"
                        : "amber"
                  }
                >
                  {v.status}
                </Badge>
              </div>
              <div className="mt-3 flex gap-4 text-xs">
                <span>
                  <strong>{v._count.products}</strong> products
                </span>
                <span>
                  <strong>{v._count.orders}</strong> orders
                </span>
                <span>
                  <strong>{v.commissionRate}%</strong> commission
                </span>
              </div>
              <Select
                className="mt-3"
                value={v.status}
                onChange={(e) => setStatus(v.id, e.target.value)}
              >
                <option value="PENDING">PENDING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </Select>
            </AdminCard>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Onboard vendor">
        <div className="space-y-3">
          <Input
            label="Business name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <Input
            label="Commission %"
            type="number"
            value={form.commissionRate}
            onChange={(e) =>
              setForm({ ...form, commissionRate: e.target.value })
            }
          />
          <Input
            label="Trade license"
            value={form.tradeLicense}
            onChange={(e) =>
              setForm({ ...form, tradeLicense: e.target.value })
            }
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setModal(false)}>
            Cancel
          </Btn>
          <Btn onClick={create} disabled={!form.name || !form.phone}>
            Create vendor
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
