"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import {
  PageHeader,
  AdminCard,
  Btn,
  Input,
  Select,
  Badge,
} from "@/components/admin/ui";
import { Loader2 } from "lucide-react";

export default function AdminStockPage() {
  const [lowStock, setLowStock] = useState<
    { id: string; name: string; stock: number; sku: string | null; category: { name: string } }[]
  >([]);
  const [movements, setMovements] = useState<
    {
      id: string;
      type: string;
      quantity: number;
      note: string | null;
      createdBy: string | null;
      createdAt: string;
      product: { name: string; stock: number };
    }[]
  >([]);
  const [products, setProducts] = useState<{ id: string; name: string; stock: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    productId: "",
    type: "IN",
    quantity: "",
    note: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [s, p] = await Promise.all([
      adminFetch("/admin/stock").then((r) => r.json()),
      adminFetch("/admin/products").then((r) => r.json()),
    ]);
    setLowStock(s.lowStock || []);
    setMovements(s.movements || []);
    setProducts(
      (p.products || []).map((x: { id: string; name: string; stock: number }) => ({
        id: x.id,
        name: x.name,
        stock: x.stock,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function adjust() {
    const res = await adminFetch("/admin/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: form.productId,
        type: form.type,
        quantity: Number(form.quantity),
        note: form.note,
      }),
    });
    if (res.ok) {
      setForm({ productId: form.productId, type: "IN", quantity: "", note: "" });
      void load();
    } else {
      const d = await res.json();
      alert(d.error || "Failed");
    }
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
        title="Stock management"
        subtitle="Inbound, outbound, adjustments & low-stock alerts"
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <AdminCard className="lg:col-span-1">
          <h2 className="mb-3 font-bold">Stock movement</h2>
          <div className="space-y-3">
            <Select
              label="Product"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (now {p.stock})
                </option>
              ))}
            </Select>
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="IN">IN — receive stock</option>
              <option value="OUT">OUT — remove stock</option>
              <option value="ADJUST">ADJUST — set absolute qty</option>
            </Select>
            <Input
              label="Quantity"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <Input
              label="Note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="PO # / damage / count"
            />
            <Btn
              className="w-full"
              onClick={adjust}
              disabled={!form.productId || !form.quantity}
            >
              Apply movement
            </Btn>
          </div>
        </AdminCard>

        <AdminCard className="lg:col-span-2">
          <h2 className="mb-3 font-bold text-red-700">
            Low stock (≤10) — {lowStock.length}
          </h2>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {lowStock.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-[10px] text-[var(--ink-muted)]">
                    {p.category?.name} · {p.sku}
                  </p>
                </div>
                <Badge tone="red">{p.stock} left</Badge>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="text-sm text-emerald-700">All stock healthy</p>
            )}
          </div>
        </AdminCard>
      </div>

      <AdminCard className="mt-4">
        <h2 className="mb-3 font-bold">Recent movements</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="text-[10px] uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="pb-2">When</th>
                <th className="pb-2">Product</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Qty</th>
                <th className="pb-2">By</th>
                <th className="pb-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-t border-[var(--line)]">
                  <td className="py-2 text-xs">
                    {new Date(m.createdAt).toLocaleString("en-BD")}
                  </td>
                  <td className="py-2 font-semibold">{m.product.name}</td>
                  <td className="py-2">
                    <Badge
                      tone={
                        m.type === "IN"
                          ? "green"
                          : m.type === "OUT"
                            ? "red"
                            : "blue"
                      }
                    >
                      {m.type}
                    </Badge>
                  </td>
                  <td className="py-2">{m.quantity}</td>
                  <td className="py-2 text-xs">{m.createdBy}</td>
                  <td className="py-2 text-xs text-[var(--ink-muted)]">
                    {m.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
