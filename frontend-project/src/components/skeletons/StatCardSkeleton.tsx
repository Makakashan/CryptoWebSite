import Skeleton from "@/components/ui/skeleton";

export const StatCardSkeleton = () => {
	return (
		<div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 backdrop-blur-xl">
			<div className="flex items-center gap-3 mb-3">
				<Skeleton className="h-8 w-8 rounded-lg" />
				<Skeleton className="h-4 w-24" />
			</div>
			<Skeleton className="h-8 w-32" />
		</div>
	);
};
