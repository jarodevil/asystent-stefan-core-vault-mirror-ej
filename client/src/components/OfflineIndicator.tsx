import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
      toast.success("Połączenie przywrócone", {
        description: "Możesz teraz korzystać ze wszystkich funkcji aplikacji.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      toast.warning("Tryb offline", {
        description: "Niektóre funkcje mogą być ograniczone.",
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <WifiOff className="w-5 h-5" />
        <span className="font-medium">Tryb offline</span>
        <span className="text-sm opacity-90">
          - Dostęp do notatek i szablonów bez ograniczeń
        </span>
      </div>
      <button
        onClick={() => setShowBanner(false)}
        className="text-white hover:bg-amber-600 rounded px-2 py-1 transition"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * Hook to check online status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
