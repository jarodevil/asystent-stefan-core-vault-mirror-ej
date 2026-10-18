# Stefan — automatyzacja produkcyjna Heartbeat

**Wydanie:** migracja niezawodnościowa 2026-10-08  
**Właściciel:** administrator projektu Stefan  
**Cel:** żadne zadanie cykliczne nie zależy od pamięci ani czasu życia pojedynczego procesu aplikacji.

## Zasada działania

| Zadanie | Endpoint | Harmonogram (UTC, format 6-polowy) | Bezpieczeństwo | Idempotencja |
|---|---|---:|---|---|
| Test modeli | `/api/scheduled/model-compatibility` | `0 15 5 * * *` | wyłącznie tożsamość Heartbeat | deterministyczny token kompatybilności |
| Nowelizacje prawne | `/api/scheduled/legal-news-refresh` | `0 5 6 * * *` | wyłącznie tożsamość Heartbeat | trwały znacznik świeżości 24 h i identyfikatory aktów |
| KSeF | `/api/scheduled/ksef-refresh` | `0 15 0,6,12,18 * * *` | wyłącznie tożsamość Heartbeat | trwałe znaczniki 6 h / 24 h i deduplikacja identyfikatorami źródła |
| Archiwizacja sesji | `/api/scheduled/session-archive` | `0 20 2 * * *` | wyłącznie tożsamość Heartbeat | aktualizuje tylko niearchiwalne sesje nieaktywne ponad 30 dni |
| Backup bazy | `/api/scheduled/database-backup` | `0 35 2 * * *` | wyłącznie tożsamość Heartbeat | jeden rotujący artefakt nadpisywany dopiero po pełnym eksporcie |

Harmonogramy działają w UTC. Zmiana czasu w Polsce nie zmienia wykonywania na platformie — zmienia jedynie lokalną godzinę obserwacji.

## Brak zadań w procesie aplikacji

Nie wolno przywracać `node-cron`, `setInterval` ani startowych `setTimeout` do wykonywania operacji biznesowych. Aplikacja WebDev może zostać zatrzymana, uśpiona lub ponownie uruchomiona; Heartbeat jest właściwym wykonawcą zadań cyklicznych.

Każdy endpoint zwraca **HTTP 500** po błędzie. To pozostawia wynik jako nieudany i pozwala platformie ponowić zadanie. Nie można oznaczać znacznika świeżości po częściowej porażce.

## Źródła prawne

- Do bazy mogą trafić wyłącznie rekordy zwrócone z urzędowego ELI API.
- Brak rekordów lub błąd źródła kończy zadanie błędem — Stefan nie tworzy danych przykładowych ani zastępczych.
- Historyczne rekordy o identyfikatorze `fallback-*` są usuwane dopiero po zapisaniu niepustego zestawu rekordów urzędowych.
- KSeF stosuje istniejącą deduplikację po stabilnym identyfikatorze źródłowym.

## Backup

Backup jest eksportem logicznym wykonywanym przez `mysql2`, więc nie wymaga binariów systemowych w produkcyjnym środowisku Node-only. Przed uploadem jest kompresowany i szyfrowany AES-256-GCM kluczem pochodzącym z zarządzanego sekretu aplikacji. W storage znajduje się tylko szyfrowany artefakt pod kluczem:

```text
system-backups/database/latest.sql.gz.enc
```

Aplikacja nie utrzymuje kopii jawnego SQL na dysku. Metadane powodzenia (klucz, rozmiar, SHA-256 artefaktu) trafiają do `systemCache` pod kluczem `database_backup_last_success`.

## Diagnostyka operacyjna

1. Sprawdź listę zadań: `manus-heartbeat list`.
2. Sprawdź czas ostatniego powodzenia w `systemCache`.
3. Jeśli zadanie źródeł prawnych/KSeF nie powiedzie się, nie zastępuj danych treścią ręcznie wymyśloną — usuń przyczynę i pozwól na ponowienie.
4. Przed zmianą harmonogramu lub kodu wykonaj checkpoint projektu i regresję `pnpm test`, `pnpm check`, `pnpm build`.
