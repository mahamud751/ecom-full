"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import Image from "next/image";
import {
  PageHeader,
  AdminCard,
  Btn,
  Input,
  Modal,
  Badge,
} from "@/components/admin/ui";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Plus, Loader2 } from "lucide-react";

export default function AdminCatalogPage() {
  const [brands, setBrands] = useState<
    {
      id: string;
      name: string;
      slug: string;
      logo: string | null;
      isActive: boolean;
      _count?: { products: number };
    }[]
  >([]);
  const [categories, setCategories] = useState<
    {
      id: string;
      name: string;
      slug: string;
      image: string | null;
      isActive: boolean;
      sortOrder: number;
      _count?: { products: number };
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"brand" | "category" | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [b, c] = await Promise.all([
      adminFetch("/admin/catalog?type=brand").then((r) => r.json()),
      adminFetch("/admin/catalog?type=category").then((r) => r.json()),
    ]);
    setBrands(b.brands || []);
    setCategories(c.categories || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!modal || !name.trim()) return;
    await adminFetch("/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: modal,
        name,
        ...(modal === "brand" ? { logo: image || null } : { image: image || null }),
      }),
    });
    setName("");
    setImage("");
    setModal(null);
    void load();
  }

  async function toggle(
    type: "brand" | "category",
    id: string,
    isActive: boolean
  ) {
    await adminFetch("/admin/catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, isActive: !isActive }),
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
        title="Brands & Categories"
        subtitle="Catalog taxonomy — upload logos & category images"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Brands ({brands.length})</h2>
            <Btn
              onClick={() => {
                setModal("brand");
                setName("");
                setImage("");
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </Btn>
          </div>
          <div className="max-h-[480px] space-y-1 overflow-y-auto">
            {brands.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--ivory)]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {b.logo ? (
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={b.logo}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="36px"
                        unoptimized={b.logo.startsWith("/uploads/")}
                      />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[10px] font-bold text-[var(--forest)]">
                      {b.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{b.name}</p>
                    <p className="text-[10px] text-[var(--ink-muted)]">
                      {b.slug} · {b._count?.products ?? 0} products
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle("brand", b.id, b.isActive)}
                >
                  <Badge tone={b.isActive ? "green" : "gray"}>
                    {b.isActive ? "On" : "Off"}
                  </Badge>
                </button>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Categories ({categories.length})</h2>
            <Btn
              onClick={() => {
                setModal("category");
                setName("");
                setImage("");
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </Btn>
          </div>
          <div className="max-h-[480px] space-y-1 overflow-y-auto">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--ivory)]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {c.image ? (
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={c.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="36px"
                        unoptimized={c.image.startsWith("/uploads/")}
                      />
                    </div>
                  ) : (
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-[var(--ivory)]" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    <p className="text-[10px] text-[var(--ink-muted)]">
                      {c.slug} · {c._count?.products ?? 0} products
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle("category", c.id, c.isActive)}
                >
                  <Badge tone={c.isActive ? "green" : "gray"}>
                    {c.isActive ? "On" : "Off"}
                  </Badge>
                </button>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === "brand" ? "New brand" : "New category"}
      >
        <div className="space-y-3">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              modal === "brand" ? "e.g. Square Pharma" : "e.g. Antibiotics"
            }
          />
          <ImageUpload
            label={modal === "brand" ? "Brand logo" : "Category image"}
            folder={modal === "brand" ? "brands" : "categories"}
            value={image}
            onChange={setImage}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setModal(null)}>
            Cancel
          </Btn>
          <Btn onClick={create} disabled={!name.trim()}>
            Create
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
