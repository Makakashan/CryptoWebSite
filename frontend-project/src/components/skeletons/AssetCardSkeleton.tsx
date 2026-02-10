import Card from "../ui/card";
import Skeleton from "../ui/skeleton";

const AssetCardSkeleton = () => {
  return (
    <Card className="overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4 h-full">
        {/* Left side - Info */}
        <div className="flex flex-col justify-between min-w-0 flex-1">
          {/* Asset header */}
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          {/* Price */}
          <div className="mb-2">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>

          {/* Category badge */}
          <div className="mt-auto">
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        </div>

        {/* Right side - Chart */}
        <div className="w-32 h-24 shrink-0">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      </div>
    </Card>
  );
};

export default AssetCardSkeleton;
