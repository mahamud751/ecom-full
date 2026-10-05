"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import Image from "next/image";
import {
  PageHeader,
  AdminCard,
  Btn,
  Input,
  Select,
  Textarea,
  Modal,
  Badge,
  Empty,
  Pager,
  useListPage,
  type Pagination,
} from "@/components/admin/ui";
import { ImageUpload, MultiImageUpload } from "@/components/admin/ImageUpload";
import { formatPrice } from "@/lib/utils";
import { Loader2, Plus, Pencil } from "lucide-react";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image: string;
  images?: string[];
  sku: string | null;
  isActive: boolean;
  isMedicine: boolean;
  isFeatured: boolean;
  description: string;
  shortDesc: string | null;
  comparePrice: number | null;
  unit: string | null;
  categoryId: string;
  brandId: string | null;
  vendorId: string | null;
  category: { name: string };
  brand: { name: string } | null;
  variants: {
    id: string;
    name: string;
    price: number;
    stock: number;
    isDefault: boolean;
    sku: string | null;
  }[];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [catalog, setCatalog] = useState<{
    categories: { id: string; name: string }[];
    brands: { id: string; name: string }[];
    vendors: { id: string; name: string }[];
  }>({ categories: [], brands: [], vendors: [] });
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [variantModal, setVariantModal] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "100",
    categoryId: "",
    brandId: "",
    vendorId: "",
    sku: "",
    description: "",
    image: "",
    images: [] as string[],
    isMedicine: false,
    isFeatured: false,
    isFlashSale: false,
    requiresRx: false,
    comparePrice: "",
    unit: "pcs",
  });
  const [vForm, setVForm] = useState({
    name: "",
    price: "",
    stock: "0",
    sku: "",
    isDefault: false,
  });

  const [page, setPage] = useListPage(q);
  const [pageInfo, setPageInfo] = useState<Pagination | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      adminFetch(`/admin/products?q=${encodeURIComponent(q)}&page=${page}`),
      adminFetch("/admin/catalog"),
    ]);
    const pData = await pRes.json();
    const cData = await cRes.json();
    setProducts(pData.products || []);
    setPageInfo(pData.pagination ?? null);
    setCatalog({
      categories: cData.categories || [],
      brands: cData.brands || [],
      vendors: cData.vendors || [],
    });
    setLoading(false);
  }, [q, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      price: "",
      stock: "100",
      categoryId: catalog.categories[0]?.id || "",
      brandId: "",
      vendorId: "",
      sku: "",
      description: "",
      image: "",
      images: [],
      isMedicine: false,
      isFeatured: false,
      isFlashSale: false,
      requiresRx: false,
      comparePrice: "",
      unit: "pcs",
    });
    setModal(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price),
      stock: String(p.stock),
      categoryId: p.categoryId,
      brandId: p.brandId || "",
      vendorId: p.vendorId || "",
      sku: p.sku || "",
      description: p.description,
      image: p.image,
      images: p.images || [],
      isMedicine: p.isMedicine,
      isFeatured: p.isFeatured,
      isFlashSale: false,
      requiresRx: false,
      comparePrice: p.comparePrice ? String(p.comparePrice) : "",
      unit: p.unit || "pcs",
    });
    setModal(true);
  }

  async function save() {
    setSaving(true);
    if (!form.image) {
      alert("Please upload a product image");
      return;
    }
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      brandId: form.brandId || null,
      vendorId: form.vendorId || null,
      image: form.image,
      images: form.images,
      description: form.description || form.name,
    };
    const res = await adminFetch(
      editing ? `/admin/products/${editing.id}` : "/admin/products",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (res.ok) {
      setModal(false);
      void load();
    } else {
      const d = await res.json();
      alert(d.error || "Save failed");
    }
  }

  async function saveVariant() {
    if (!variantModal) return;
    setSaving(true);
    const res = await adminFetch("/admin/variants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: variantModal.id,
        name: vForm.name,
        price: Number(vForm.price),
        stock: Number(vForm.stock),
        sku: vForm.sku || null,
        isDefault: vForm.isDefault,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setVariantModal(null);
      setVForm({ name: "", price: "", stock: "0", sku: "", isDefault: false });
      void load();
    } else {
      const d = await res.json();
      alert(d.error || "Failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Medicines, beauty, devices — with variants & stock"
        actions={
          <>
            <Input
              placeholder="Search name / SKU"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-48"
            />
            <Btn onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" /> New product
            </Btn>
          </>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
        </div>
      ) : products.length === 0 ? (
        <Empty text="No products found" />
      ) : (
        <AdminCard className="overflow-x-auto p-0">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--ivory)] text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Variants</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-[var(--line)]/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={p.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                          unoptimized={p.image?.startsWith("/uploads/")}
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          {p.sku || p.slug}
                          {p.isMedicine ? " · Medicine" : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs">{p.category?.name}</td>
                  <td className="px-3 py-3 font-semibold">
                    {formatPrice(p.price)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        p.stock <= 10
                          ? "font-bold text-red-600"
                          : "text-[var(--ink)]"
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {p.variants.length}{" "}
                    <button
                      type="button"
                      className="ml-1 font-bold text-[var(--forest)]"
                      onClick={() => setVariantModal(p)}
                    >
                      +add
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={p.isActive ? "green" : "gray"}>
                      {p.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Btn variant="ghost" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      )}

      <Pager
        pagination={pageInfo}
        onPage={setPage}
        disabled={loading}
      />
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit product" : "New product"}
        wide
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />
          <Input
            label="Price *"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <Input
            label="Compare price"
            type="number"
            value={form.comparePrice}
            onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
          />
          <Input
            label="Stock"
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
          <Input
            label="Unit"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
          <Select
            label="Category *"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">Select</option>
            {catalog.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Brand"
            value={form.brandId}
            onChange={(e) => setForm({ ...form, brandId: e.target.value })}
          >
            <option value="">None</option>
            {catalog.brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <Select
            label="Vendor (B2B)"
            value={form.vendorId}
            onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
          >
            <option value="">Ahona warehouse</option>
            {catalog.vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </Select>
          <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
            <ImageUpload
              label="Main image *"
              folder="products"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
            />
            <MultiImageUpload
              label="Gallery (optional)"
              folder="products"
              values={form.images}
              onChange={(images) => setForm({ ...form, images })}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="flex flex-wrap gap-4 sm:col-span-2">
            {(
              [
                ["isMedicine", "Medicine"],
                ["isFeatured", "Featured"],
                ["isFlashSale", "Flash sale"],
                ["requiresRx", "Requires Rx"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 text-xs font-semibold"
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: e.target.checked })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setModal(false)}>
            Cancel
          </Btn>
          <Btn
            onClick={save}
            disabled={saving || !form.name || !form.categoryId}
          >
            {saving ? "Saving…" : "Save product"}
          </Btn>
        </div>
      </Modal>

      <Modal
        open={!!variantModal}
        onClose={() => setVariantModal(null)}
        title={`Variants — ${variantModal?.name || ""}`}
      >
        {variantModal && (
          <>
            <div className="mb-4 space-y-2">
              {variantModal.variants.map((v) => (
                <div
                  key={v.id}
                  className="flex justify-between rounded-lg bg-[var(--ivory)] px-3 py-2 text-sm"
                >
                  <span>
                    {v.name} {v.isDefault && <Badge tone="blue">Default</Badge>}
                  </span>
                  <span>
                    {formatPrice(v.price)} · stock {v.stock}
                  </span>
                </div>
              ))}
              {variantModal.variants.length === 0 && (
                <p className="text-xs text-[var(--ink-muted)]">
                  No variants yet — add pack sizes / strengths
                </p>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                label="Variant name *"
                placeholder="e.g. 10 tablets / 500mg"
                value={vForm.name}
                onChange={(e) => setVForm({ ...vForm, name: e.target.value })}
              />
              <Input
                label="Price"
                type="number"
                value={vForm.price}
                onChange={(e) => setVForm({ ...vForm, price: e.target.value })}
              />
              <Input
                label="Stock"
                type="number"
                value={vForm.stock}
                onChange={(e) => setVForm({ ...vForm, stock: e.target.value })}
              />
              <Input
                label="SKU"
                value={vForm.sku}
                onChange={(e) => setVForm({ ...vForm, sku: e.target.value })}
              />
              <label className="flex items-center gap-2 text-xs font-semibold sm:col-span-2">
                <input
                  type="checkbox"
                  checked={vForm.isDefault}
                  onChange={(e) =>
                    setVForm({ ...vForm, isDefault: e.target.checked })
                  }
                />
                Set as default (syncs product price/stock)
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <Btn onClick={saveVariant} disabled={saving || !vForm.name}>
                Add variant
              </Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
