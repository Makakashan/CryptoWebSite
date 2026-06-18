import { ShieldCheck } from "lucide-react";

type Props = {
	title: string;
	verified?: boolean;
};

/**
 * Hero band for the Profile page — eyebrow + 5xl headline + verification badge.
 *
 * No 3D or rotating ring around the avatar (kept clean).
 * The glass surface still gets the pointer-tracked spotlight +
 * iridescent edge from glass-premium.css.
 */
export const ProfileHero = ({ title, verified }: Props) => (
	<div className="glass-hero-glass px-6 py-7 md:px-8 md:py-9">
		<div className="glass-panel-inner flex items-center justify-between gap-4">
			<div>
				<div className="glass-eyebrow">
					<span className="glass-eyebrow-dot" />
					Account
				</div>
				<h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
					{title}
				</h1>
				<p className="mt-2 text-sm text-text-secondary md:text-base">
					Manage your identity, security and account preferences
				</p>
			</div>
			<div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
				<ShieldCheck className="h-4 w-4 text-emerald-300" />
				<span className="text-xs text-text-secondary">
					{verified ? "Account verified" : "Verification pending"}
				</span>
			</div>
		</div>
	</div>
);
