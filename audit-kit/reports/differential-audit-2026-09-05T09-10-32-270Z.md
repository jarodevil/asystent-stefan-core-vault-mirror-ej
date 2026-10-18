# Stefan — raport audytu różnicowego

**Data:** 2026-09-05T09:10:32.270Z

| Decyzja | Zmodyfikowane pliki | Zmiany krytyczne |
|---|---:|---:|
| **standard-change-review** | 1 | 0 |

## Zmiany

| Plik | Typ | Ryzyko | Kontrakt |
|---|---|---|---|
| `server/_core/stefan-audit-pack.test.ts` | added | test | — |

## Kolejny krok

1. Wykonaj bezkosztową walidację: `npx tsc --noEmit`.
2. Wykonaj wyłącznie testy celowane: `npx tsc --noEmit`.
3. Nie uruchamiaj pełnego `pnpm test` rutynowo — zestaw zawiera testy analizy PDF, które wywołują model Gemini.
4. Promuj baseline dopiero po pozytywnej walidacji: `node stefan_diff_audit.mjs --project <projekt> --promote --verified`.
