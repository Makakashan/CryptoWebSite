import Skeleton from "@/components/ui/skeleton";

interface TableSkeletonProps {
	rows?: number;
}

export const TableSkeleton = ({ rows = 5 }: TableSkeletonProps) => {
	return (
		<div className="overflow-x-auto">
			<table className="w-full">
				<thead>
					<tr>
						{Array.from({ length: 5 }).map((_, i) => (
							<th key={i} className="text-left pb-4">
								<Skeleton className="h-4 w-20" />
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{Array.from({ length: rows }).map((_, rowIdx) => (
						<tr key={rowIdx}>
							{Array.from({ length: 5 }).map((_, colIdx) => (
								<td key={colIdx} className="py-3">
									<Skeleton className="h-4 w-20" />
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
