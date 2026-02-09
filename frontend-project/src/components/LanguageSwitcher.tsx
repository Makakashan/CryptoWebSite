import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "pl" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      className="btn-outline btn-small px-3 py-2"
      onClick={toggleLanguage}
    >
      {i18n.language === "en" ? "🇬🇧 EN" : "🇵🇱 PL"}
    </button>
  );
};

export default LanguageSwitcher;
