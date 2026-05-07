import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

const Header = () => {
	const { user } = useSelector((state: RootState) => state.auth);

	return (
		<header className="h-16 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40">
			<div className="flex items-center gap-2">
				<h2 className="text-sm font-semibold text-white/60">
					MakakaTrade Terminal
				</h2>
			</div>
			<div className="flex items-center gap-4">
				<div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
					<div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
					<span className="text-xs font-medium text-emerald-400">Live</span>
				</div>
				<div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
					<span className="text-sm font-medium text-white">
						${(user?.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
					</span>
				</div>
			</div>
		</header>
	);
};

export default Header;
