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
import { ImageUpload } from "@/components/admin/ImageUpload";
import { formatPrice } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";

export default function AdminLabPage() {
  const [tests, setTests] = useState<
    {
      id: string;
      name: string;
      price: number;
      comparePrice: number | null;
      reportHours: number;
      isActive: boolean;
      category: string | null;
      bookedCount: number;
    }[]
  >([]);
  const [packages, setPackages] = useState<
    {
      id: string;
      name: string;
      price: number;
      isActive: boolean;
      items: { test: { name: string } }[];
    }[]
  >([]);
  const [bookings, setBookings] = useState<
    {
      id: string;
      bookingNumber: string;
      customerName: string;
      customerPhone: string;
      status: string;
      total: number;
      labTest: { name: string } | null;
      labPackage: { name: string } | null;
    }[]
  >([]);
  const [tab, setTab] = useState<"tests" | "packages" | "bookings">("tests");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"test" | "package" | null>(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    comparePrice: "",
    reportHours: "24",
    category: "",
    image: "",
    testIds: [] as string[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    const d = await adminFetch("/admin/lab").then((r) => r.json());
    setTests(d.tests || []);
    setPackages(d.packages || []);
    setBookings(d.bookings || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!modal) return;
    const body =
      modal === "test"
        ? {
            kind: "test",
            name: form.name,
            price: Number(form.price),
            comparePrice: form.comparePrice
              ? Number(form.comparePrice)
              : null,
            reportHours: Number(form.reportHours),
            category: form.category || null,
            image: form.image || null,
          }
        : {
            kind: "package",
            name: form.name,
            price: Number(form.price),
            comparePrice: form.comparePrice
              ? Number(form.comparePrice)
              : null,
            reportHours: Number(form.reportHours),
            testIds: form.testIds,
            image: form.image || null,
          };
    await adminFetch("/admin/lab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setModal(null);
    setForm({
      name: "",
      price: "",
      comparePrice: "",
      reportHours: "24",
      category: "",
      image: "",
      testIds: [],
    });
    void load();
  }

  async function setBookingStatus(id: string, status: string) {
    await adminFetch("/admin/lab", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "booking", id, status }),
    });
    void load();
  }

  async function toggleTest(id: string, isActive: boolean) {
    await adminFetch("/admin/lab", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "test", id, isActive: !isActive }),
    });
    void load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Lab tests & packages"
        subtitle="Individual tests, health packages, home collection bookings"
        actions={
          <>
            <Btn
              variant="secondary"
              onClick={() => {
                setModal("test");
                setForm({
                  name: "",
                  price: "",
                  comparePrice: "",
                  reportHours: "24",
                  category: "",
                  image: "",
                  testIds: [],
                });
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Test
            </Btn>
            <Btn
              onClick={() => {
                setModal("package");
                setForm({
                  name: "",
                  price: "",
                  comparePrice: "",
                  reportHours: "24",
                  category: "",
                  image: "",
                  testIds: [],
                });
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Package
            </Btn>
          </>
        }
      />

      <div className="mb-4 flex gap-2">
        {(["tests", "packages", "bookings"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize ${
              tab === t
                ? "bg-[var(--forest)] text-white"
                : "bg-white border border-[var(--line)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "tests" && (
        <AdminCard className="p-0 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm text-left">
            <thead className="bg-[var(--ivory)] text-[10px] uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3">Test</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Report</th>
                <th className="px-3 py-3">Booked</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3 font-semibold">{t.name}</td>
                  <td className="px-3 py-3 text-xs">{t.category || "—"}</td>
                  <td className="px-3 py-3">{formatPrice(t.price)}</td>
                  <td className="px-3 py-3 text-xs">{t.reportHours}h</td>
                  <td className="px-3 py-3">{t.bookedCount}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleTest(t.id, t.isActive)}>
                      <Badge tone={t.isActive ? "green" : "gray"}>
                        {t.isActive ? "Active" : "Off"}
                      </Badge>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tests.length === 0 && <Empty text="No lab tests" />}
        </AdminCard>
      )}

      {tab === "packages" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {packages.map((p) => (
            <AdminCard key={p.id}>
              <div className="flex justify-between">
                <h3 className="font-bold">{p.name}</h3>
                <Badge tone={p.isActive ? "green" : "gray"}>
                  {p.isActive ? "Active" : "Off"}
                </Badge>
              </div>
              <p className="mt-1 text-lg font-bold text-[var(--forest)]">
                {formatPrice(p.price)}
              </p>
              <p className="mt-2 text-xs text-[var(--ink-muted)]">
                Includes:{" "}
                {p.items.map((i) => i.test.name).join(", ") || "No tests linked"}
              </p>
            </AdminCard>
          ))}
          {packages.length === 0 && <Empty text="No packages" />}
        </div>
      )}

      {tab === "bookings" && (
        <div className="space-y-2">
          {bookings.map((b) => (
            <AdminCard key={b.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-xs">{b.bookingNumber}</p>
                  <p className="font-bold">{b.customerName}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {b.customerPhone} ·{" "}
                    {b.labTest?.name || b.labPackage?.name} ·{" "}
                    {formatPrice(b.total)}
                  </p>
                </div>
                <Select
                  value={b.status}
                  onChange={(e) => setBookingStatus(b.id, e.target.value)}
                  className="w-48"
                >
                  {[
                    "PENDING",
                    "CONFIRMED",
                    "SAMPLE_COLLECTED",
                    "PROCESSING",
                    "REPORT_READY",
                    "CANCELLED",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </AdminCard>
          ))}
          {bookings.length === 0 && <Empty text="No lab bookings yet" />}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === "test" ? "New lab test" : "New package"}
      >
        <div className="space-y-3">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <Input
              label="Compare price"
              type="number"
              value={form.comparePrice}
              onChange={(e) =>
                setForm({ ...form, comparePrice: e.target.value })
              }
            />
          </div>
          <Input
            label="Report hours"
            type="number"
            value={form.reportHours}
            onChange={(e) => setForm({ ...form, reportHours: e.target.value })}
          />
          <ImageUpload
            label="Cover image"
            folder="lab"
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url })}
          />
          {modal === "test" && (
            <Input
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Blood, Thyroid…"
            />
          )}
          {modal === "package" && (
            <div>
              <p className="mb-1 text-xs font-semibold text-[var(--ink-muted)]">
                Include tests
              </p>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[var(--line)] p-2">
                {tests.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={form.testIds.includes(t.id)}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          testIds: e.target.checked
                            ? [...form.testIds, t.id]
                            : form.testIds.filter((x) => x !== t.id),
                        });
                      }}
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setModal(null)}>
            Cancel
          </Btn>
          <Btn onClick={create} disabled={!form.name || !form.price}>
            Create
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
