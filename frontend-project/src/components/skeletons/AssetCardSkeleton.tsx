import Skeleton from "@/components/ui/skeleton";

export const AssetCardSkeleton = () => {
	return (
		<div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 backdrop-blur-xl">
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-3">
					<Skeleton className="h-10 w-10 rounded-full" />
					<div>
						<Skeleton className="h-4 w-24 mb-1.5" />
						<Skeleton className="h-3 w-16" />
					</div>
				</div>
				<Skeleton className="h-4 w-16" />
			</div>
			<div className="flex items-end justify-between">
				<div>
					<Skeleton className="h-7 w-28 mb-2" />
					<Skeleton className="h-3 w-20" />
				</div>
				<div className="w-24 h-8">
					<Skeleton className="h-full w-full rounded-lg" />
				</div>
			</div>
		</div>
	);
};
