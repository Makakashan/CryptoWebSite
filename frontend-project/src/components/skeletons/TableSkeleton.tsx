import Card, { CardContent } from "../ui/card";
import Skeleton from "../ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

const TableSkeleton = ({ rows = 5, columns = 4 }: TableSkeletonProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        {/* Table Header */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-bg-hover">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-4 flex-1" />
          ))}
        </div>

        {/* Table Rows */}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex items-center gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={`h-10 ${colIndex === 0 ? "w-16" : "flex-1"}`}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TableSkeleton;
