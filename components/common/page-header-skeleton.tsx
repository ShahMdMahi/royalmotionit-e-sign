import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full hidden sm:block" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-5 w-64" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  );
}
