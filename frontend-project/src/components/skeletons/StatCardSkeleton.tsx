import Card, { CardContent } from "../ui/card";
import Skeleton from "../ui/skeleton";

const StatCardSkeleton = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="w-12 h-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCardSkeleton;
