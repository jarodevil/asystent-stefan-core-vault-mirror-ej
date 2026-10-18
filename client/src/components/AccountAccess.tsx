import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { KeyRound, LogIn, LogOut, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";

type AccountAccessProps = {
  variant?: "header" | "inline";
};

const ACCESS_PIN = "XXXX";

export default function AccountAccess({
  variant = "header",
}: AccountAccessProps) {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const isHeader = variant === "header";
  const displayName = user?.name || user?.email || "Konto Manus";

  const handleContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pin !== ACCESS_PIN) {
      setPinError(true);
      return;
    }

    window.location.assign(getLoginUrl());
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setPin("");
      setPinError(false);
    }
  };

  if (loading) {
    return isHeader ? null : (
      <p className="text-sm text-muted-foreground">Sprawdzanie sesji konta…</p>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        size={isHeader ? "sm" : "default"}
        variant={user ? "outline" : isHeader ? "outline" : "default"}
        className={isHeader ? "gap-2 bg-background/70" : "mt-4 gap-2"}
        onClick={() => setOpen(true)}
      >
        {user ? <UserRound className="size-4" /> : <LogIn className="size-4" />}
        <span className={isHeader ? "hidden sm:inline" : undefined}>
          {user ? displayName : "Zaloguj się"}
        </span>
      </Button>

      <DialogContent className="max-w-md">
        {user ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-office text-xl">
                <UserRound className="size-5 text-primary" /> Zalogowano
              </DialogTitle>
              <DialogDescription>
                Dane robocze są przypisane do tego konta Manus OAuth.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-primary/15 bg-primary/[0.035] p-4 text-sm">
              <p className="font-semibold text-foreground">{displayName}</p>
              <p className="mt-1 text-muted-foreground">
                Sesje, notatki, dokumenty oraz karty klientów są odseparowane
                według konta użytego po zalogowaniu.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Zamknij
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  void logout();
                  setOpen(false);
                }}
              >
                <LogOut className="size-4" /> Wyloguj się
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleContinue} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-office text-xl">
                <KeyRound className="size-5 text-primary" /> Wejście do danych
                roboczych
              </DialogTitle>
              <DialogDescription>
                Wprowadź prosty kod wejściowy, a następnie zaloguj się kontem
                Manus. To konto, a nie PIN, rozdziela zapisane dane
                użytkowników.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label
                htmlFor="stefan-access-pin"
                className="text-sm font-medium"
              >
                Kod wejściowy
              </label>
              <Input
                id="stefan-access-pin"
                autoComplete="off"
                value={pin}
                onChange={event => {
                  setPin(event.target.value.toUpperCase());
                  setPinError(false);
                }}
                placeholder="Wpisz kod"
                aria-invalid={pinError}
                aria-describedby={
                  pinError ? "stefan-access-pin-error" : undefined
                }
              />
              {pinError && (
                <p
                  id="stefan-access-pin-error"
                  className="text-sm text-destructive"
                >
                  Nieprawidłowy kod wejściowy.
                </p>
              )}
              <p className="text-xs leading-5 text-muted-foreground">
                Kod jest celowo prosty i nie zastępuje ochrony konta. Przy tej
                konfiguracji użyj kodu:{" "}
                <strong className="text-foreground">XXXX</strong>.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Anuluj
              </Button>
              <Button type="submit">
                <LogIn className="size-4" /> Przejdź do logowania
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
