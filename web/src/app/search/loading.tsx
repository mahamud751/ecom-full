import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function SearchLoading() {
  return (
    <div className="container-main space-y-6 py-6">
      <Skeleton className="h-10 w-64" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  );
}
