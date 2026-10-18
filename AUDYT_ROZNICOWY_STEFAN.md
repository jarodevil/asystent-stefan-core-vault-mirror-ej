# Audyt różnicowy Stefana

**Pakiet:** Stefan Audit Pack v1.0  
**Cel:** ograniczyć rutynowy koszt kontroli bez obniżania bezpieczeństwa prawnego, KSeF ani ochrony danych.

## Zasada działania

Pakiet zapisuje SHA-256 plików aplikacji i porównuje je z zatwierdzonym baseline. Nie korzysta przy tym z Gemini, ELI, RSS ani innych usług zewnętrznych. Gdy nie ma zmiany w kodzie, kontrola czyta wyłącznie manifest, status probe modelu i logi zadań. Gdy zmienia się moduł krytyczny, raport wskazuje dokładnie, które pliki przeczytać i które testy uruchomić.

| Poziom | Kiedy | Zakres | Koszt LLM |
|---|---|---|---:|
| Szybki | Brak zmian hashy | TypeScript, wynik probe, logi | 0 |
| Zmiana standardowa | UI lub moduł niewrażliwy | Tylko pliki zmienione i testy modułu | 0 |
| Eskalacja krytyczna | LLM, KSeF/ELI, baza, PWA, dokumenty | Zmienione kontrakty i testy bezpieczeństwa | 0 domyślnie |
| Pełny audit | Restore, zmiana modelu/provider, awaria probe lub rozjazd produkcji | Audyt rozszerzony | tylko gdy jest uzasadnione |

## Codzienna kontrola bez kosztu modelu

```bash
pnpm audit:diff
npx tsc --noEmit
```

Jeżeli raport zwróci `fast-audit-pass`, nie analizuj całej aplikacji i nie uruchamiaj pełnego `pnpm test`. Pełny zestaw zawiera testy analizy PDF, które mogą korzystać z Gemini.

## Kontrola po zmianie kodu

Raport zwróci `critical-change-escalation` oraz listę testów. Dopiero po ich pozytywnym przejściu zatwierdź aktualny stan:

```bash
pnpm audit:diff
pnpm audit:promote
```

## Granice automatyzacji

Pakiet nie zastępuje kontroli aktualnej podstawy prawnej ani zawodowej weryfikacji dokumentu przed wysyłką. Nie promuje baseline automatycznie; wymaga jawnego parametru `--verified`. Pełny audit jest obowiązkowy po odtworzeniu backupu, zmianie modelu lub dostawcy, błędzie probe, zmianie struktury źródeł urzędowych albo rozbieżności wersji produkcyjnej i repozytorium.

## Zawartość

- `audit-kit/stefan-audit-baseline.json` — zatwierdzony snapshot 178 plików Systemu Stefan;
- `audit-kit/stefan-audit-candidate.json` — ostatni kandydat do porównania, nie jest zaufanym baseline;
- `audit-kit/reports/` — raporty lokalnych kontroli różnicowych;
- `/home/ubuntu/skills/stefan-audit-pack/` — przenośny skill z instrukcją, skryptem i kontraktami.
