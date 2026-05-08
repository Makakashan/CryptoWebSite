import { memo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

const Header = () => {
	const { user } = useSelector((state: RootState) => state.auth);

	return (
		<header className="sticky top-4 z-40 mx-4 h-16 liquid-glass-strong rounded-[1.5rem]">
			<div className="flex h-full items-center justify-end gap-4 px-6">
				<div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-black/20 px-4 py-1.5">
					<div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
					<span className="text-xs font-medium text-emerald-400">Live</span>
				</div>
				<div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/25 px-4 py-1.5">
					<span className="text-sm font-medium text-white">
						${(user?.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
					</span>
				</div>
			</div>
		</header>
	);
};

export default memo(Header);
