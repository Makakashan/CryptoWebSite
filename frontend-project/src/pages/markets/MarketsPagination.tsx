import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button";

type Props = {
	currentPage: number;
	totalPages: number;
	onChange: (page: number) => void;
};

/**
 * Bottom pagination controls.
 */
export const MarketsPagination = ({ currentPage, totalPages, onChange }: Props) => {
	const { t } = useTranslation();

	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center justify-center gap-4 pt-6">
			<Button
				variant="outline"
				size="sm"
				className="glass-muted-button"
				onClick={() => onChange(currentPage - 1)}
				disabled={currentPage === 1}
			>
				{t("previous")}
			</Button>
			<span className="text-text-secondary px-4 text-sm font-medium">
				{t("page")} {currentPage} {t("of")} {totalPages}
			</span>
			<Button
				variant="outline"
				size="sm"
				className="glass-muted-button"
				onClick={() => onChange(currentPage + 1)}
				disabled={currentPage === totalPages}
			>
				{t("next")}
			</Button>
		</div>
	);
};
