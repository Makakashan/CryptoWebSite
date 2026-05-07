import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
			className="header-language-switch disabled:cursor-not-allowed disabled:opacity-60"
			onClick={toggleLanguage}
		>
			{isEnglish ? "🇬🇧 EN" : "🇵🇱 PL"}
		</button>
	);
};

export default LanguageSwitcher;
