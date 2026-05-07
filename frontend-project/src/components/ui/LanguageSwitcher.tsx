import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

const LanguageSwitcher = () => {
	const { i18n } = useTranslation();

	const toggleLanguage = () => {
		const newLang = i18n.language === "en" ? "pl" : "en";
		i18n.changeLanguage(newLang);
	};

	return (
		<button
			className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/70 text-xs font-medium transition-all duration-200 hover:bg-white/[0.08] hover:text-white hover:border-white/30 backdrop-blur-xl"
			onClick={toggleLanguage}
		>
			<Languages className="w-3.5 h-3.5" />
			{i18n.language === "en" ? "EN" : "PL"}
		</button>
	);
};

export default LanguageSwitcher;
