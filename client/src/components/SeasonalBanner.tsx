import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getActiveBanner, BANNER_VARIANT_STYLES, BANNER_VARIANT_ICONS } from "@/lib/seasonal-banners";

/**
 * SeasonalBanner — dynamiczny baner świąteczny.
 * Automatycznie wykrywa aktywne święto i wyświetla odpowiedni komunikat.
 * Użytkownik może zamknąć baner — decyzja jest zapamiętywana w sessionStorage
 * (baner wraca przy nowej sesji przeglądarki).
 */
export default function SeasonalBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [banner, setBanner] = useState(() => getActiveBanner());

  // Sprawdź czy baner był już zamknięty w tej sesji
  useEffect(() => {
    if (!banner) return;
    try {
      const key = `stefan_banner_dismissed_${banner.id}_${new Date().toDateString()}`;
      if (sessionStorage.getItem(key)) setDismissed(true);
    } catch {
      // sessionStorage niedostępny (tryb prywatny / iframe) — ignoruj
    }
  }, [banner]);

  const handleDismiss = () => {
    if (!banner) return;
    try {
      const key = `stefan_banner_dismissed_${banner.id}_${new Date().toDateString()}`;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage niedostępny — ignoruj
    }
    setDismissed(true);
  };

  if (!banner || dismissed) return null;

  const styles = BANNER_VARIANT_STYLES[banner.variant];
  const icon = BANNER_VARIANT_ICONS[banner.variant];

  return (
    <div
      className={`
        relative flex items-start gap-3 rounded-lg border px-4 py-3 mb-4
        ${styles.container} ${styles.border}
        transition-all duration-300
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">
        {icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${styles.title}`}>
          {banner.title}
        </p>
        <p className={`text-sm mt-0.5 leading-relaxed ${styles.text}`}>
          {banner.message}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className={`shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${styles.icon}`}
        aria-label="Zamknij powiadomienie"
        title="Zamknij"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
