import Skeleton from "@/components/ui/skeleton";

export const StatsChartSkeleton = () => {
	return (
		<div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 backdrop-blur-xl">
			<div className="flex items-center justify-between mb-6">
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-6 w-32" />
			</div>
			<Skeleton className="h-64 w-full rounded-lg" />
		</div>
	);
};
