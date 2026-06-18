import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Card, { CardContent } from "@/components/ui/card";

const CATEGORIES = [
	"Layer 1",
	"DeFi",
	"Smart Contract Platform",
	"Exchange Token",
	"Meme",
	"Gaming",
];

type Props = {
	search: string;
	setSearch: (v: string) => void;
	category: string;
	setCategory: (v: string) => void;
	sortBy: string;
	setSortBy: (v: string) => void;
	sortOrder: "asc" | "desc";
	setSortOrder: (v: "asc" | "desc") => void;
	showFilters: boolean;
	setShowFilters: (v: boolean) => void;
	hasActiveFilters: boolean;
	onApply: () => void;
	onReset: () => void;
};

/**
 * Filter panel — search input + filters toggle + apply/reset buttons.
 */
export const MarketsFilters = ({
	search,
	setSearch,
	category,
	setCategory,
	sortBy,
	setSortBy,
	sortOrder,
	setSortOrder,
	showFilters,
	setShowFilters,
	hasActiveFilters,
	onApply,
	onReset,
}: Props) => {
	const { t } = useTranslation();

	return (
		<Card className="glass-filter-panel">
			<CardContent className="glass-panel-inner p-4">
				<div className="glass-filter-grid">
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-text-secondary" />
							<Input
								type="text"
								placeholder={t("searchAssets")}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								onKeyPress={(e) => e.key === "Enter" && onApply()}
								className="pl-10"
							/>
						</div>

						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowFilters(!showFilters)}
								className={`glass-muted-button gap-2 ${hasActiveFilters ? "border-white/20 text-white" : ""}`}
							>
								<SlidersHorizontal className="h-4 w-4" />
								{t("filters")}
								{hasActiveFilters && (
									<span className="ml-1 h-2 w-2 rounded-full bg-white/80" />
								)}
							</Button>
							<Button size="sm" className="glass-cta-button" onClick={onApply}>
								{t("apply")}
							</Button>
							{hasActiveFilters && (
								<Button
									variant="ghost"
									size="sm"
									onClick={onReset}
									className="glass-muted-button gap-1"
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>

					{showFilters && (
						<div className="grid grid-cols-1 gap-3 border-t border-white/8 pt-3 animate-in fade-in slide-in-from-top-2 duration-200 sm:grid-cols-2 lg:grid-cols-3">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-medium text-text-secondary">
									{t("category")}
								</label>
								<Select value={category} onChange={(e) => setCategory(e.target.value)}>
									<option value="">{t("all")}</option>
									{CATEGORIES.map((cat) => (
										<option key={cat} value={cat}>
											{cat}
										</option>
									))}
								</Select>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-medium text-text-secondary">
									{t("sortBy")}
								</label>
								<Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
									<option value="price">{t("price")}</option>
									<option value="symbol">{t("symbol")}</option>
									<option value="name">{t("name")}</option>
								</Select>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-medium text-text-secondary">
									{t("order")}
								</label>
								<Select
									value={sortOrder}
									onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
								>
									<option value="desc">{t("highToLow")}</option>
									<option value="asc">{t("lowToHigh")}</option>
								</Select>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
