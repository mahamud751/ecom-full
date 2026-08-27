import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function StoreLoading() {
  return (
    <div className="container-main space-y-5 py-5">
      <Skeleton className="h-40 w-full rounded-2xl md:h-48" />
      <div className="flex flex-col gap-5 lg:flex-row">
        <Skeleton className="h-96 w-full rounded-2xl lg:w-60" />
        <div className="min-w-0 flex-1">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
