# Audyt Stefana po odtworzeniu — 2026-09-05

## Stan projektu

Repozytorium wskazywało checkpoint `5b25d86`, opisany jako Stefan 5.6.0. To jest ostatni znany checkpoint w repozytorium, ale dokumentacja była niespójna: `MANIFEST.md` nadal deklarował wersję 4.8.0 i `gemini-3-pro`, podczas gdy `todo.md` deklarował 5.6.0.

## Krytyczna niezgodność modeli

Żywy katalog proxy z 2026-09-05 udostępniał `gemini-3.1-pro-preview` oraz `gemini-3-flash-preview`; nie zwracał `gemini-2.5-pro`, `gemini-2.5-flash` ani `gemini-3-pro`. Przywrócony kod próbował używać `gemini-2.5-pro`, a panel operatora pokazywał `gemini-3-pro`. To mogło powodować błąd lub rozjazd między deklarowanym i faktycznym modelem.

Minimalny probe `gemini-3.1-pro-preview` przeszedł po ustawieniu `max_tokens=1024` i `reasoning_effort=low`. Probe z `max_tokens=32` zwrócił pustą treść z `finish_reason=length`, co potwierdza, że limit musi uwzględniać tokeny reasoning.

## Krytyczna niezgodność bramki bezpieczeństwa

Dotychczasowa ścieżka po nieudanej walidacji zwracała oryginalną odpowiedź po dopisaniu linku ISAP i disclaimera. To nie dowodziło prawdziwości treści i nie było bezpiecznym fail-closed. Zmieniono ją tak, aby niespełniająca odpowiedź była zastępowana neutralnym komunikatem blokady.

## Wdrożone poprawki

- Runtime: `gemini-3.1-pro-preview` jako model główny, `gemini-3-flash-preview` jako fallback.
- Runtime: `reasoning_effort` zamiast nieobsługiwanego `thinking_level`; domyślny limit 16384 tokenów, probe może używać 1024 i low reasoning.
- Cost Guard: ceny i fallback zgodne z żywym katalogiem.
- Hierarchical prompting: faktyczny wybrany model jest przekazywany do `invokeLLM`, a nie tylko logowany.
- Whitelist bezpieczeństwa: tylko modele zweryfikowane w katalogu oraz `manus-llm` awaryjnie.
- Fail-closed: niespełniająca odpowiedź nie jest wyświetlana.
- Heartbeat: dodano obsługę cron identity w legacy SDK/types oraz endpoint `/api/scheduled/model-compatibility`.
- Probe: dwa krótkie testy kontraktowe modeli zapisują wynik do `systemCache` pod `model_compatibility_last`.
- Testy: 192/192 pass, TypeScript 0 errors.

## Pozostaje przed harmonogramem produkcyjnym

Endpoint wymaga wdrożenia aktualnego checkpointu. Dopiero po publikacji należy utworzyć project-level Heartbeat, np. dziennie, z callbackiem `/api/scheduled/model-compatibility`. Nie wolno używać dodatkowego `setInterval` do tego testu. Wbudowane stare cron-y projektu nadal używają timerów in-process i wymagają osobnego refaktoru.

## Weryfikacja produkcji

Live URL `https://kancelaria-mefa9ha9.manus.space` odpowiada poprawnie, ale stopka interfejsu pokazuje **System Stefan v5.1.0**. Repozytorium ma checkpoint `5b25d86` opisany jako **Stefan 5.6.0**. Oznacza to, że produkcja nie jest aktualnie zgodna z ostatnim checkpointem audytowanym lokalnie. Nie wolno traktować poprawek bezpieczeństwa z tego audytu jako aktywnych w produkcji przed publikacją nowego checkpointu.
