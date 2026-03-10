import Skeleton from "../ui/skeleton";

const StatsChartSkeleton = () => {
	return (
		<div className="card-padded stats-chart-card">
			<div className="stats-chart-header">
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-6 w-20 rounded-full" />
			</div>
			<Skeleton className="h-4 w-60 mb-4" />
			<div className="h-75 w-full rounded-xl bg-bg-hover/40 relative overflow-hidden">
				<Skeleton className="absolute inset-0" />
			</div>
		</div>
	);
};

export default StatsChartSkeleton;
