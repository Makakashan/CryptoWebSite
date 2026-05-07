import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

const LanguageSwitcher = () => {
	const { i18n } = useTranslation();
	const [isSwitching, setIsSwitching] = useState(false);
	const lockRef = useRef(false);
	const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isEnglish = (i18n.resolvedLanguage || i18n.language || "en").startsWith("en");

	const toggleLanguage = () => {
		if (lockRef.current) return;

		const currentLang = (i18n.resolvedLanguage || i18n.language || "en").startsWith("en")
			? "en"
			: "pl";
		const newLang = currentLang === "en" ? "pl" : "en";

		lockRef.current = true;
		setIsSwitching(true);
		void i18n.changeLanguage(newLang);

		if (unlockTimerRef.current) {
			clearTimeout(unlockTimerRef.current);
		}

		unlockTimerRef.current = setTimeout(() => {
			lockRef.current = false;
			setIsSwitching(false);
		}, 300);
	};

	return (
		<button
			type="button"
			disabled={isSwitching}
			className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 transition-all duration-200 hover:border-white/30 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 backdrop-blur-xl"
			onClick={toggleLanguage}
			aria-label={isEnglish ? "Switch to Polish" : "Switch to English"}
		>
			<Languages className="w-3.5 h-3.5" />
			{isEnglish ? "EN" : "PL"}
		</button>
	);
};

export default LanguageSwitcher;
