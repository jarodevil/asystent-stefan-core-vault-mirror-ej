import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLegalModel, type LegalModelResult, type LegalSurface, validateLegalSettingUpdate } from "./_core/legal-model-gateway";
import { contextManager } from "./_core/context-manager";
import { KSEF_TIMELINE, KSEF_EXCEPTIONS, KSEF_TRANSITIONAL_2026, KSEF_AUTH_METHODS, KSEF_SANCTIONS, KSEF_SYSTEM_PROMPT_EXTENSION, checkKsefObligation } from "./ksef-knowledge";
import { KSEF_TEMPLATES, KSEF_TEMPLATE_CATEGORIES, fillKsefTemplate, getKsefTemplatesByCategory } from "./ksef-templates";
import { getKsefAlerts, getKsefAlertStats, markKsefAlertRead, markAllKsefAlertsRead, refreshKsefAlerts, seedHistoricalKsefAlerts } from "./_core/ksef-monitor";
import {
  getUserSessions, getArchivedSessions, createSession, updateSessionTitle,
  archiveSession, restoreSession, deleteSession, getSessionMessages,
  getSessionMessagesForUser, saveSessionMessage, saveMessagePairForUser,
  getSessionMessageCount, getLastSession, generateSessionTitle,
} from "./db-sessions";
import { getCacheStats } from "./_core/system-cache";
import {
  getUserNotes, getNotesByCategory, getNote, searchNotes, getNoteCount,
  createNote, updateNoteTitle, updateNoteContent, updateNoteCategory,
  toggleNotePin, deleteNote, generateNoteTitle,
} from "./db-notes";
import {
  saveGeneratedDocument, getUserDocuments, getClientDocuments,
  getDocumentById, updateDocumentNotes, updateDocumentStatus,
  deleteDocument, assignDocumentToClient,
} from "./db-documents";

// Manus-managed legal model integration (no direct Google key is used).
async function callGeminiAPI(
  message: string,
  history: any[] = [],
  surface: LegalSurface = "chat",
  signal?: AbortSignal
): Promise<LegalModelResult> {
  const currentDate = new Date().toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Pobierz najnowsze nowelizacje z RSS (< 24h)
  const { getRecentLegalNews } = await import("./db-legal-news");
  const { formatNewsForPrompt } = await import("./_core/rss-fetcher");
  const recentNews = await getRecentLegalNews();
  const newsContext = formatNewsForPrompt(recentNews);

  const systemPrompt = `Jesteś Stefan, Starszy Partner w polskiej kancelarii prawnej KancelariAI. Dzisiejsza data: ${currentDate}.

${newsContext}


⚠️ KRYTYCZNE ZASADY BEZPIECZEŃSTWA - BEZWZGLĘDNY ZAKAZ HALUCYNACJI:

1. ABSOLUTNY ZAKAZ CYTOWANIA NIEISTNIEJĄCYCH AKTÓW PRAWNYCH
   - NIE WOLNO Ci wymyslać, generować ani cytować nieistniejących numerów Dziennika Ustaw (Dz. U.)
   - NIE WOLNO Ci tworzyć fałszywych artykułów, ustaw, rozporządzeń ani innych aktów prawnych
   - Fałszowanie aktów prawnych jest PRZESTĘPSTWEM i naraża użytkownika na poważne konsekwencje prawne

2. JEŚLI NIE MASZ PEWNOŚCI CO DO ŹRÓDŁA:
   - Odpowiedz: "Nie mam dostępu do pełnej bazy aktów prawnych. Proszę zweryfikować tę informację w systemie ISAP (https://isap.sejm.gov.pl) lub skonsultować się z prawnikiem."
   - NIE próbuj odgadnąć, wymyslić ani "prawdopodobnie" podać źródła

3. DOZWOLONE CYTOWANIA:
   - Ogólne odwołania do znanych ustaw (np. "Kodeks cywilny", "Kodeks pracy")
   - Ogólne zasady prawne bez konkretnych numerów artykułów, jeśli nie jesteś pewien
   - ZAWSZE dodaj: "Zalecam weryfikację w systemie ISAP"

4. OBOWIĄZKOWY DISCLAIMER + ISAP LINKS:
   - Na końcu KAŻDEJ odpowiedzi dodaj:
   "⚠️ UWAGA: Analiza nie stanowi porady prawnej. Przed podjęciem jakichkolwiek działań prawnych OBOWIĄZKOWO zweryfikuj wszystkie informacje w systemie ISAP (https://isap.sejm.gov.pl) lub skonsultuj się z uprawnionyę prawnikiem."
   - Dla każdego cytowanego aktu dodaj bezpośredni link do ISAP (jeśli znasz dokładny numer)

5. STYL ODPOWIEDZI:
   - Odpowiadaj po polsku, zwięźle i merytorycznie
   - Używaj TYLKO polskiego prawa obowiązującego w ${new Date().getFullYear()} roku
   - W razie wątpliwości - kieruj do weryfikacji, NIE wymyslaj

PAMIĘTAJ: Twoja odpowiedzialność to bezpieczeństwo użytkownika. Lepiej przyznać się do braku pewności niż podać fałszywe informacje.

TEMPERATURA ODPOWIEDZI: 0.0-0.3 (NISKA) = BRAK KREATYWNOŚCI, TYLKO FAKTY
TO GWARANTUJE PRECYZJĘ I ELIMINUJE HALUCYNACJE.

${KSEF_SYSTEM_PROMPT_EXTENSION}`;

  const rawMessages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: message },
  ];

  // Optymalizacja kontekstu - zapobiega przełądowaniu
  const contextWindow = contextManager.processMessages(rawMessages);
  const messages = contextWindow.messages;

  // Log compression ratio dla monitoringu
  if (contextWindow.compressionRatio < 1.0) {
    console.log(`[CONTEXT] Skompresowano kontekst: ${(contextWindow.compressionRatio * 100).toFixed(1)}% oryginalnej wielkości`);
  }

  return invokeLegalModel(messages, surface, { signal });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    sendMessage: publicProcedure
      .input(z.object({
        message: z.string(),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
        sessionId: z.number().optional(), // jeśli podane — zapisz do DB
      }))
      .mutation(async ({ ctx, input }) => {
        const controller = new AbortController();
        const abortRequest = () => controller.abort();
        ctx.req.once("aborted", abortRequest);
        try {
          const response = await callGeminiAPI(
            input.message,
            input.history || [],
            "chat",
            controller.signal
          );
          // Jeśli użytkownik zalogowany i podano sessionId — zapisz parę do DB
          if (ctx.user && input.sessionId) {
            await saveMessagePairForUser(input.sessionId, ctx.user.id, input.message, response.content).catch(() => {});
          }
          return {
            success: true,
            message: response.content,
            model: response.model,
            fallbackUsed: response.fallbackUsed,
            safetyBlocked: response.safetyBlocked,
          };
        } catch (error: any) {
          if (controller.signal.aborted) {
            throw error;
          }
          console.error("[Chat Error]", error);
          return {
            success: false,
            message: "Przepraszam, wystąpił problem z połączeniem. Spróbuj ponownie za chwilę.",
            model: "fallback",
          };
        } finally {
          ctx.req.off("aborted", abortRequest);
        }
      }),
  }),

  // ===== SESSIONS ROUTER =====
  sessions: router({
    // Pobierz aktywne sesje użytkownika
    getActive: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      const sessions = await getUserSessions(ctx.user.id);
      // Dodaj liczbę wiadomości do każdej sesji
      const withCounts = await Promise.all(
        sessions.map(async (s) => ({
          ...s,
          messageCount: await getSessionMessageCount(s.id),
        }))
      );
      return withCounts;
    }),

    // Pobierz zarchiwizowane sesje
    getArchived: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      const sessions = await getArchivedSessions(ctx.user.id);
      const withCounts = await Promise.all(
        sessions.map(async (s) => ({
          ...s,
          messageCount: await getSessionMessageCount(s.id),
        }))
      );
      return withCounts;
    }),

    // Pobierz wiadomości sesji (do wczytania historii)
    getMessages: protectedProcedure
      .input(z.object({ sessionId: z.number(), limit: z.number().optional().default(100) }))
      .query(async ({ ctx, input }) => {
        return getSessionMessagesForUser(input.sessionId, ctx.user.id, input.limit);
      }),

    // Utwórz nową sesję
    create: publicProcedure
      .input(z.object({ title: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const title = input.title || `Sesja ${new Date().toLocaleDateString("pl-PL")}`;
        const sessionId = await createSession(ctx.user.id, title);
        return { sessionId, title };
      }),

    // Utwórz sesję z pierwszą wiadomością (auto-title)
    createWithMessage: publicProcedure
      .input(z.object({ firstMessage: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const title = generateSessionTitle(input.firstMessage);
        const sessionId = await createSession(ctx.user.id, title);
        await saveSessionMessage(sessionId, "user", input.firstMessage);
        return { sessionId, title };
      }),

    // Pobierz lub utwórz ostatnią sesję (do automatycznego wznowienia)
    getOrCreateLast: publicProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const last = await getLastSession(ctx.user.id);
      if (last) {
        const messages = await getSessionMessages(last.id, 50);
        return { session: last, messages, isNew: false };
      }
      return { session: null, messages: [], isNew: true };
    }),

    // Jednorazowe przeniesienie historii z wcześniejszej lokalnej wersji aplikacji.
    // Nie analizuje treści i nie wywołuje modelu — tylko zapisuje ją w koncie OAuth.
    importLocalHistory: protectedProcedure
      .input(z.object({
        title: z.string().trim().min(1).max(255),
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(20000),
        })).min(1).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessionId = await createSession(ctx.user.id, input.title);
        for (const message of input.messages) {
          await saveSessionMessage(sessionId, message.role, message.content);
        }
        return { sessionId, messageCount: input.messages.length };
      }),

    // Aktualizuj tytuł sesji
    updateTitle: publicProcedure
      .input(z.object({ sessionId: z.number(), title: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await updateSessionTitle(input.sessionId, ctx.user.id, input.title);
        return { success: true };
      }),

    // Archiwizuj sesję
    archive: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await archiveSession(input.sessionId, ctx.user.id);
        return { success: true };
      }),

    // Przywróć sesję z archiwum
    restore: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await restoreSession(input.sessionId, ctx.user.id);
        return { success: true };
      }),

    // Usuń sesję
    delete: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await deleteSession(input.sessionId, ctx.user.id);
        return { success: true };
      }),

    // Status cache systemu (owner)
    getCacheStats: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return getCacheStats();
    }),
  }),

  analysis: router({
    analyzeDocument: publicProcedure
      .input(z.object({
        content: z.string(),
        filename: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const currentDate = new Date().toLocaleDateString("pl-PL", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const prompt = `Jesteś ekspertem prawnym. Dzisiejsza data: ${currentDate}.

ZADANIE: Przeanalizuj poniższy dokument prawny i wskaż:
1. **Typ dokumentu**
2. **Potencjalne ryzyka**
3. **Rekomendacje**

DOKUMENT:
	${input.content}
	
	ANALIZA:`;
	
	          const result = await callGeminiAPI(prompt, [], "document");
	          
	          return {
	            success: true,
	            analysis: result.content,
	            sources: [],
	            model: result.model,
	            fallbackUsed: result.fallbackUsed,
	            safetyBlocked: result.safetyBlocked,
	          };
        } catch (error: any) {
          console.error("[Analysis Error]", error.message, error.stack);
          const errorMessage = error.message || "Nieznany błąd";
          return {
            success: false,
            analysis: `Nie udało się przeanalizować dokumentu. Błąd: ${errorMessage}`,
            sources: [],
            model: "fallback",
          };
        }
      }),

    analyzePDFWithGemini: publicProcedure
      .input(z.object({
        fileData: z.string(), // base64 encoded PDF
        filename: z.string(),
        mimeType: z.string().default("application/pdf"),
      }))
      .mutation(async ({ input }) => {
        try {
          const currentDate = new Date().toLocaleDateString("pl-PL", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          // Convert base64 to buffer
          const buffer = Buffer.from(input.fileData, "base64");
          
          // Upload to S3 (temporary storage)
          const { storagePut } = await import("./storage");
          const randomSuffix = Math.random().toString(36).substring(7);
          const fileKey = `temp-pdf/${randomSuffix}-${input.filename}`;
          const { url: pdfUrl } = await storagePut(fileKey, buffer, input.mimeType);

          // Call Gemini with PDF file
          const prompt = `Jesteś ekspertem prawnym. Dzisiejsza data: ${currentDate}.

ZADANIE: Przeanalizuj poniższy dokument PDF i wskaż:
1. **Typ dokumentu**
2. **Potencjalne ryzyka**
3. **Rekomendacje**

ANALIZA:`;

	          const result = await invokeLegalModel(
	            [
	              {
	                role: "system",
	                content: `Jesteś Stefan, asystent prawny. Analizuj wyłącznie informacje możliwe do zweryfikowania. Nie twórz podstaw prawnych ani faktów. Jeśli brakuje pewności, powiedz to wprost. Zakończ odpowiedź linkiem do oficjalnego źródła ISAP oraz tekstem: "⚠️ UWAGA: Analiza nie stanowi porady prawnej."`,
	              },
	              {
	                role: "user",
	                content: [
                  { type: "text", text: prompt },
                  {
                    type: "file_url",
                    file_url: {
                      url: pdfUrl,
                      mime_type: "application/pdf",
                    },
                  },
	                ],
	              },
	            ],
	            "pdf"
	          );

          // TODO: Cleanup temporary file from S3 (optional - can use lifecycle policy)
          // const { storageDelete } = await import("./storage");
          // await storageDelete(fileKey);

	          return {
	            success: true,
	            analysis: result.content,
	            sources: [],
	            model: result.model,
	            fallbackUsed: result.fallbackUsed,
	            safetyBlocked: result.safetyBlocked,
	          };
        } catch (error: any) {
          console.error("[PDF Analysis Error]", error.message, error.stack);
          const errorMessage = error.message || "Nieznany błąd";
          return {
            success: false,
            analysis: `Nie udało się przeanalizować pliku PDF. Błąd: ${errorMessage}`,
            sources: [],
            model: "fallback",
          };
        }
      }),
  }),

  legalNews: router({
    getSourceCatalog: publicProcedure.query(async () => {
      const { OFFICIAL_LEGAL_SOURCES } = await import("./_core/legal-source-policy");
      return OFFICIAL_LEGAL_SOURCES;
    }),

    getAll: publicProcedure.query(async () => {
      const { getAllLegalNews } = await import("./db-legal-news");
      return getAllLegalNews();
    }),

    getRecent: publicProcedure.query(async () => {
      const { getRecentLegalNews } = await import("./db-legal-news");
      return getRecentLegalNews();
    }),

    refresh: publicProcedure.mutation(async () => {
      try {
        const { refreshLegalNews } = await import("./_core/legal-news-refresh");
        const result = await refreshLegalNews({ force: true });

        return {
          success: true,
          count: result.count,
          removedFallbackCount: result.removedFallbackCount,
        };
      } catch (error: any) {
        console.error("[RSS Refresh Error]", error);
        return {
          success: false,
          count: 0,
        };
      }
    }),
  }),

  // KSeF Module - Krajowy System e-Faktur
  ksef: router({
    // Get full KSeF timeline
    getTimeline: publicProcedure.query(() => {
      return KSEF_TIMELINE;
    }),

    // Get KSeF exceptions
    getExceptions: publicProcedure.query(() => {
      return KSEF_EXCEPTIONS;
    }),

    // Get transitional simplifications for 2026
    getTransitional2026: publicProcedure.query(() => {
      return KSEF_TRANSITIONAL_2026;
    }),

    // Get authentication methods
    getAuthMethods: publicProcedure.query(() => {
      return KSEF_AUTH_METHODS;
    }),

    // Get KSeF sanctions (art. 106ni)
    getSanctions: publicProcedure.query(() => {
      return KSEF_SANCTIONS;
    }),

    // Check KSeF obligation for given entity parameters
    checkObligation: publicProcedure
      .input(z.object({
        annualSalesGross2024: z.number().optional(),
        monthlySalesInvoiced: z.number().optional(),
        hasPolishSeat: z.boolean(),
        isVatPayer: z.boolean(),
        transactionType: z.enum(["b2b", "b2c", "b2g"]),
        specialProcedure: z.enum(["oss_non_eu", "ioss", "sme", "none"]).optional(),
      }))
      .query(({ input }) => {
        return checkKsefObligation(input);
      }),

    // Get all KSeF templates
    getTemplates: publicProcedure.query(() => {
      return KSEF_TEMPLATES.map(t => ({
        id: t.id,
        title: t.title,
        shortTitle: t.shortTitle,
        description: t.description,
        category: t.category,
        legalBasis: t.legalBasis,
        fields: t.fields,
        notes: t.notes,
        lastVerified: t.lastVerified,
      }));
    }),

    // Get templates by category
    getTemplatesByCategory: publicProcedure
      .input(z.object({
        category: z.enum(["uprawnienia", "korekta", "offline", "wdrozenie", "inne"]),
      }))
      .query(({ input }) => {
        return getKsefTemplatesByCategory(input.category).map(t => ({
          id: t.id,
          title: t.title,
          shortTitle: t.shortTitle,
          description: t.description,
          category: t.category,
          legalBasis: t.legalBasis,
          fields: t.fields,
          notes: t.notes,
          lastVerified: t.lastVerified,
        }));
      }),

    // Get template categories
    getTemplateCategories: publicProcedure.query(() => {
      return KSEF_TEMPLATE_CATEGORIES;
    }),

    // Fill template with user-provided values and return completed document
    fillTemplate: publicProcedure
      .input(z.object({
        templateId: z.string(),
        values: z.record(z.string(), z.string()),
      }))
      .mutation(({ input }) => {
        const template = KSEF_TEMPLATES.find(t => t.id === input.templateId);
        if (!template) {
          throw new Error(`Template not found: ${input.templateId}`);
        }
        const filledContent = fillKsefTemplate(template, input.values as Record<string, string>);
        return {
          templateId: template.id,
          title: template.title,
          category: template.category,
          legalBasis: template.legalBasis,
          content: filledContent,
          notes: template.notes,
          generatedAt: new Date().toISOString(),
        };
      }),

    // Get KSeF alerts list
    getAlerts: publicProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
        onlyUnread: z.boolean().optional().default(false),
        priority: z.enum(["wysoki", "sredni", "niski"]).optional(),
        source: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const alerts = await getKsefAlerts({
          limit: input.limit,
          onlyUnread: input.onlyUnread,
          priority: input.priority,
          source: input.source,
        });
        return alerts;
      }),

    // Get KSeF alert statistics
    getAlertStats: publicProcedure.query(async () => {
      return getKsefAlertStats();
    }),

    // Mark single alert as read
    markRead: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await markKsefAlertRead(input.id);
        return { success: true };
      }),

    // Mark all alerts as read
    markAllRead: publicProcedure.mutation(async () => {
      await markAllKsefAlertsRead();
      return { success: true };
    }),

    // Manual refresh (owner/admin)
    refreshAlerts: publicProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const result = await refreshKsefAlerts();
      return result;
    }),

    // Seed historical KSeF data (last 90 days) — admin/owner only
    seedHistorical: publicProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const result = await seedHistoricalKsefAlerts();
      return result;
    }),

    // ===== KSEF CLIENT CARDS =====

    // Get all client cards
    getClientCards: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        status: z.enum(["not_started", "in_progress", "completed", "issues"]).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const { ksefClientCards } = await import("../drizzle/schema");
        const { like, eq, and, desc } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const conditions: any[] = [eq(ksefClientCards.createdBy, ctx.user.id)];
        if (input?.search) {
          conditions.push(like(ksefClientCards.clientName, `%${input.search}%`));
        }
        if (input?.status) {
          conditions.push(eq(ksefClientCards.implementationStatus, input.status));
        }
        const cards = await db
          .select()
          .from(ksefClientCards)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(ksefClientCards.updatedAt));
        return cards;
      }),

    // Get single client card
    getClientCard: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const { ksefClientCards } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const [card] = await db
          .select()
          .from(ksefClientCards)
          .where(and(eq(ksefClientCards.id, input.id), eq(ksefClientCards.createdBy, ctx.user.id)));
        if (!card) throw new Error("Card not found");
        return card;
      }),

    // Create client card
    createClientCard: publicProcedure
      .input(z.object({
        clientName: z.string().min(1),
        nip: z.string().min(10).max(13),
        address: z.string().optional(),
        taxOffice: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal("")),
        contactPhone: z.string().optional(),
        implementationStatus: z.enum(["not_started", "in_progress", "completed", "issues"]).default("not_started"),
        obligationDate: z.string().optional(),
        obligationType: z.enum(["mandatory_large", "mandatory_standard", "voluntary", "exempt"]).optional(),
        authMethod: z.enum(["token", "qualified_sig", "trusted_sig", "not_set"]).optional(),
        checklistJson: z.string().optional(),
        zawFaGranted: z.boolean().default(false),
        zawFaDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const { ksefClientCards } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const [result] = await db.insert(ksefClientCards).values({
          ...input,
          contactEmail: input.contactEmail || undefined,
          createdBy: ctx.user.id,
        });
        return { id: (result as any).insertId, success: true };
      }),

    // Update client card
    updateClientCard: publicProcedure
      .input(z.object({
        id: z.number(),
        clientName: z.string().min(1).optional(),
        nip: z.string().min(10).max(13).optional(),
        address: z.string().optional(),
        taxOffice: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        implementationStatus: z.enum(["not_started", "in_progress", "completed", "issues"]).optional(),
        obligationDate: z.string().optional(),
        obligationType: z.enum(["mandatory_large", "mandatory_standard", "voluntary", "exempt"]).optional(),
        authMethod: z.enum(["token", "qualified_sig", "trusted_sig", "not_set"]).optional(),
        checklistJson: z.string().optional(),
        zawFaGranted: z.boolean().optional(),
        zawFaDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const { ksefClientCards } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const { id, ...updateData } = input;
        await db.update(ksefClientCards).set(updateData).where(and(eq(ksefClientCards.id, id), eq(ksefClientCards.createdBy, ctx.user.id)));
        return { success: true };
      }),

    // Delete client card
    deleteClientCard: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const { ksefClientCards } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.delete(ksefClientCards).where(and(eq(ksefClientCards.id, input.id), eq(ksefClientCards.createdBy, ctx.user.id)));
        return { success: true };
      }),

    // Ask KSeF question via AI (with verified knowledge base)
    askQuestion: publicProcedure
      .input(z.object({
        question: z.string(),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const currentDate = new Date().toLocaleDateString("pl-PL", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          // Inject recent KSeF alerts from DB into context (last 30 days, high+medium priority)
          let ksefAlertsContext = "";
          try {
            const recentAlerts = await getKsefAlerts({ limit: 20 });
            if (recentAlerts.length > 0) {
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              const relevant = recentAlerts
                .filter(a => new Date(a.publishedAt) >= thirtyDaysAgo)
                .slice(0, 10);
              if (relevant.length > 0) {
                const alertLines = relevant.map(a => {
                  const dateStr = new Date(a.publishedAt).toLocaleDateString("pl-PL");
                  const basis = a.legalBasis ? ` (${a.legalBasis})` : "";
                  return `- [${dateStr}] ${a.title}${basis} — Źródło: ${a.source} | ${a.url}`;
                }).join("\n");
                ksefAlertsContext = `\n\n## AKTUALNE ALERTY KSEF Z MONITORINGU (ostatnie 30 dni):\n${alertLines}\n\nPowyższe alerty są pobrane z oficjalnych źródeł rządowych w czasie rzeczywistym. Uwzględniaj je w odpowiedziach.`;
                console.log(`[KSeF askQuestion] Injected ${relevant.length} recent alerts into context`);
              }
            }
          } catch (alertErr: any) {
            console.warn("[KSeF askQuestion] Could not load alerts for context:", alertErr.message);
          }

          const ksefSystemPrompt = `Jesteś Stefan, ekspert ds. KSeF (Krajowy System e-Faktur) w polskiej kancelarii prawnej KancelariAI. Dzisiejsza data: ${currentDate}.

ODPOWIADAJ WYŁĄCZNIE NA PODSTAWIE ZWERYFIKOWANEJ WIEDZY O KSEF.

${KSEF_SYSTEM_PROMPT_EXTENSION}${ksefAlertsContext}

⚠️ KRYTYCZNE ZASADY:
1. TYLKO fakty z oficjalnych źródeł rządowych (ksef.podatki.gov.pl, gov.pl, isap.sejm.gov.pl)
2. ZAKAZ konfabulacji - jeśli nie masz pewności, powiedz to wprost
3. ZAWSZE podawaj podstawę prawną (numer Dz. U., artykuł ustawy)
4. Odpowiadaj po polsku, konkretnie i merytorycznie
5. Jeśli pytanie dotyczy tematu objętego alertem z monitoringu, KONIECZNIE go przywołaj
6. Na końcu każdej odpowiedzi dodaj: "Źródło: ksef.podatki.gov.pl | Weryfikacja: isap.sejm.gov.pl"

TEMPERATURA: 0.1 (TYLKO FAKTY, ZERO KREATYWNOŚCI)`;

          const messages = [
            { role: "system" as const, content: ksefSystemPrompt },
            ...(input.history || []).map((msg) => ({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            })),
	            { role: "user" as const, content: input.question },
	          ];
	
	          const result = await invokeLegalModel(messages, "ksef");
	
	          return {
	            success: true,
	            answer: result.content,
	            model: result.model,
	            fallbackUsed: result.fallbackUsed,
	            safetyBlocked: result.safetyBlocked,
	          };
        } catch (error: any) {
          console.error("[KSeF Question Error]", error);
          return {
            success: false,
            answer: "Przepraszam, wystąpił problem z połączeniem. Spróbuj ponownie.",
            model: "fallback",
          };
        }
      }),
  }),

  // Developer Panel (Owner-Only)
  dev: router({
    // Get all dev settings
    getSettings: publicProcedure.query(async ({ ctx }) => {
      // Owner-only check
      if (!ctx.user || ctx.user.email !== "pasjar1979@gmail.com") {
        throw new Error("Unauthorized: Owner-only");
      }
      const { getAllDevSettings } = await import("./db-dev");
      return getAllDevSettings();
    }),

    // Update dev setting
    updateSetting: publicProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Owner-only check
        if (!ctx.user || ctx.user.email !== "pasjar1979@gmail.com") {
          throw new Error("Unauthorized: Owner-only");
        }
        validateLegalSettingUpdate(input.key, input.value);
        const { updateDevSetting } = await import("./db-dev");
        return updateDevSetting(input.key, input.value, ctx.user.id);
      }),

    getModelAuditEvents: publicProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).optional().default(50) }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user || ctx.user.email !== "pasjar1979@gmail.com") {
          throw new Error("Unauthorized: Owner-only");
        }
        const { getRecentModelAuditEvents } = await import("./db-model-audit");
        return getRecentModelAuditEvents(input.limit);
      }),

    // Get error logs
    getErrorLogs: publicProcedure
      .input(z.object({
        limit: z.number().optional().default(100),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ ctx, input }) => {
        // Owner-only check
        if (!ctx.user || ctx.user.email !== "pasjar1979@gmail.com") {
          throw new Error("Unauthorized: Owner-only");
        }
        const { getErrorLogs } = await import("./db-dev");
        return getErrorLogs(input.limit, input.offset);
      }),

    // Get unresolved error logs
    getUnresolvedErrors: publicProcedure.query(async ({ ctx }) => {
      // Owner-only check
      if (!ctx.user || ctx.user.email !== "pasjar1979@gmail.com") {
        throw new Error("Unauthorized: Owner-only");
      }
      const { getUnresolvedErrorLogs } = await import("./db-dev");
      return getUnresolvedErrorLogs();
    }),

    // Resolve error log
    resolveError: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Owner-only check
        if (!ctx.user || ctx.user.email !== "pasjar1979@gmail.com") {
          throw new Error("Unauthorized: Owner-only");
        }
        const { resolveErrorLog } = await import("./db-dev");
        await resolveErrorLog(input.id);
        return { success: true };
      }),

    // Get quality metrics
    getQualityMetrics: publicProcedure
      .input(z.object({
        limit: z.number().optional().default(100),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ ctx, input }) => {
        // Owner-only check
        if (!ctx.user || ctx.user.email !== "pasjar1979@gmail.com") {
          throw new Error("Unauthorized: Owner-only");
        }
        const { getQualityMetrics } = await import("./db-dev");
        return getQualityMetrics(input.limit, input.offset);
      }),

    // Get source whitelist
    getSourceWhitelist: publicProcedure.query(async ({ ctx }) => {
      // Owner-only check
      if (!ctx.user || ctx.user.email !== "pasjar1979@gmail.com") {
        throw new Error("Unauthorized: Owner-only");
        }
      const { getAllSourceWhitelist } = await import("./db-dev");
      return getAllSourceWhitelist();
    }),

    // Add source to whitelist
    addSource: publicProcedure
      .input(z.object({
        domain: z.string(),
        description: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Owner-only check
        if (!ctx.user || ctx.user.email !== "pasjar1979@gmail.com") {
          throw new Error("Unauthorized: Owner-only");
        }
        const { addSourceWhitelist } = await import("./db-dev");
        return addSourceWhitelist(input.domain, input.description, ctx.user.id);
      }),

    // Update source whitelist (activate/deactivate)
    updateSource: publicProcedure
      .input(z.object({
        id: z.number(),
        active: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Owner-only check
        if (!ctx.user || ctx.user.email !== "pasjar1979@gmail.com") {
          throw new Error("Unauthorized: Owner-only");
        }
        const { updateSourceWhitelist } = await import("./db-dev");
        await updateSourceWhitelist(input.id, input.active);
        return { success: true };
      }),
  }),

  // ===== NOTES ROUTER =====
  notes: router({
    // Pobierz wszystkie notatki użytkownika
    getAll: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return getUserNotes(ctx.user.id);
    }),

    // Pobierz notatki wg kategorii
    getByCategory: publicProcedure
      .input(z.object({
        category: z.enum(["ksef", "klient", "sprawa", "preferencja", "inne"]),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) return [];
        return getNotesByCategory(ctx.user.id, input.category);
      }),

    // Wyszukaj notatki
    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) return [];
        if (!input.query.trim()) return getUserNotes(ctx.user.id);
        return searchNotes(ctx.user.id, input.query);
      }),

    // Liczba notatek
    getCount: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return 0;
      return getNoteCount(ctx.user.id);
    }),

    // Utwórz notatkę z odpowiedzi Stefana
    create: publicProcedure
      .input(z.object({
        content: z.string(),
        title: z.string().optional(),
        category: z.enum(["ksef", "klient", "sprawa", "preferencja", "inne"]).optional().default("inne"),
        sessionId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const title = input.title?.trim() || generateNoteTitle(input.content);
        const noteId = await createNote(
          ctx.user.id,
          title,
          input.content,
          input.category,
          input.sessionId
        );
        return { noteId, title };
      }),

    // Aktualizuj tytuł
    updateTitle: publicProcedure
      .input(z.object({ noteId: z.number(), title: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await updateNoteTitle(input.noteId, ctx.user.id, input.title);
        return { success: true };
      }),

    // Aktualizuj treść
    updateContent: publicProcedure
      .input(z.object({ noteId: z.number(), content: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await updateNoteContent(input.noteId, ctx.user.id, input.content);
        return { success: true };
      }),

    // Aktualizuj kategorię
    updateCategory: publicProcedure
      .input(z.object({
        noteId: z.number(),
        category: z.enum(["ksef", "klient", "sprawa", "preferencja", "inne"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await updateNoteCategory(input.noteId, ctx.user.id, input.category);
        return { success: true };
      }),

    // Przełącz przypięcie
    togglePin: publicProcedure
      .input(z.object({ noteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const isPinned = await toggleNotePin(input.noteId, ctx.user.id);
        return { isPinned };
      }),

    // Usuń notatkę
    delete: publicProcedure
      .input(z.object({ noteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await deleteNote(input.noteId, ctx.user.id);
        return { success: true };
      }),
   }),

  // -----------------------------------------------------------------------
  // Documents router — wygenerowane dokumenty z szablonów
  // -----------------------------------------------------------------------
  documents: router({
    // Pobierz wszystkie dokumenty użytkownika
    getAll: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return getUserDocuments(ctx.user.id);
    }),
    // Pobierz dokumenty powiązane z kartą klienta
    getByClient: publicProcedure
      .input(z.object({ clientCardId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) return [];
        return getClientDocuments(ctx.user.id, input.clientCardId);
      }),
    // Pobierz pojedynczy dokument
    getById: publicProcedure
      .input(z.object({ docId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) return null;
        return getDocumentById(ctx.user.id, input.docId);
      }),
    // Zapisz nowy dokument
    save: publicProcedure
      .input(z.object({
        templateId: z.string(),
        templateTitle: z.string(),
        category: z.string(),
        content: z.string(),
        fieldValues: z.record(z.string(), z.unknown()).optional(),
        legalBasis: z.string().optional(),
        clientCardId: z.number().optional(),
        clientName: z.string().optional(),
        clientNip: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const template = KSEF_TEMPLATES.find((item) => item.id === input.templateId);
        if (!template) {
          throw new Error("Dokument może zostać zapisany wyłącznie z zatwierdzonego szablonu KSeF.");
        }
        if (!input.legalBasis || input.legalBasis !== template.legalBasis) {
          throw new Error("Niezweryfikowana podstawa prawna dokumentu. Wygeneruj dokument ponownie z aktualnego szablonu.");
        }
        const id = await saveGeneratedDocument({
          ...input,
          templateTitle: template.title,
          category: template.category,
          legalBasis: template.legalBasis,
          userId: ctx.user.id,
        });
        return { success: true, id };
      }),
    // Aktualizuj notatki do dokumentu
    updateNotes: publicProcedure
      .input(z.object({ docId: z.number(), notes: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await updateDocumentNotes(ctx.user.id, input.docId, input.notes);
        return { success: true };
      }),
    // Zmień status dokumentu
    updateStatus: publicProcedure
      .input(z.object({
        docId: z.number(),
        status: z.enum(["draft", "final", "archived"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await updateDocumentStatus(ctx.user.id, input.docId, input.status);
        return { success: true };
      }),
    // Przypisz dokument do karty klienta
    assignToClient: publicProcedure
      .input(z.object({
        docId: z.number(),
        clientCardId: z.number(),
        clientName: z.string(),
        clientNip: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await assignDocumentToClient(
          ctx.user.id, input.docId, input.clientCardId, input.clientName, input.clientNip
        );
        return { success: true };
      }),
    // Usuń dokument
    delete: publicProcedure
      .input(z.object({ docId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await deleteDocument(ctx.user.id, input.docId);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
