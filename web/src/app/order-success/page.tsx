import Link from "next/link";
import { CheckCircle2, Package, Home, ShoppingBag, MapPin } from "lucide-react";

type Props = {
  searchParams: Promise<{ order?: string; total?: string }>;
};

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { order, total } = await searchParams;

  return (
    <div className="container-main flex max-w-lg flex-col items-center px-4 py-16 text-center lg:py-20">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--gold-soft)] shadow-inner">
        <CheckCircle2 className="h-14 w-14 text-[var(--forest)]" />
      </div>
      <h1 className="font-serif text-3xl font-semibold text-[var(--forest-deep)]">
        Order placed!
      </h1>
      <p className="mt-3 text-[var(--ink-muted)]">
        Thank you for shopping with Ahona. We&apos;ll call to confirm shortly.
      </p>

      {order && (
        <div className="mt-6 w-full rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--ink-muted)]">
            <Package className="h-4 w-4" />
            Order Number
          </div>
          <p className="mt-1 font-mono text-xl font-bold tracking-wide text-[var(--forest-deep)]">
            {order}
          </p>
          {total && (
            <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
              Total paid on delivery: ৳{total}
            </p>
          )}
          <p className="mt-3 text-xs text-[var(--ink-muted)]">
            Payment: Cash on Delivery · Express 12–24 hours
          </p>
        </div>
      )}

      <div className="mt-6 w-full space-y-2">
        {order && (
          <Link
            href={`/track-order?order=${order}`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--forest-deep)] py-3.5 font-bold text-white"
          >
            <MapPin className="h-4 w-4" /> Track this order
          </Link>
        )}
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[var(--forest)] py-3 font-semibold text-[var(--forest)]"
          >
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link
            href="/store"
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white py-3 font-bold text-[var(--ink)]"
          >
            <ShoppingBag className="h-4 w-4" /> Keep shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
