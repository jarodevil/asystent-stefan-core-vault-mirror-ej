import { and, eq, gte, sql } from "drizzle-orm";
import { chatMessages, chatSessions, users } from "../drizzle/schema";
import { getDb } from "../server/db";

const ownerOpenId = process.env.OWNER_OPEN_ID;

if (!ownerOpenId) {
  throw new Error("OWNER_OPEN_ID is not configured");
}

const db = await getDb();
if (!db) {
  throw new Error("Database connection is unavailable");
}

const [owner] = await db
  .select({ id: users.id })
  .from(users)
  .where(eq(users.openId, ownerOpenId))
  .limit(1);

if (!owner) {
  console.log(JSON.stringify({ ownerFound: false, sessionsLast7Days: 0, messagesLast7Days: 0 }));
  process.exit(0);
}

const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const [sessionCount] = await db
  .select({ count: sql<number>`count(*)` })
  .from(chatSessions)
  .where(and(eq(chatSessions.userId, owner.id), gte(chatSessions.updatedAt, cutoff)));

const [messageCount] = await db
  .select({ count: sql<number>`count(*)` })
  .from(chatMessages)
  .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
  .where(and(eq(chatSessions.userId, owner.id), gte(chatMessages.createdAt, cutoff)));

const [allSessionStats] = await db
  .select({
    count: sql<number>`count(*)`,
    earliest: sql<Date | null>`min(${chatSessions.createdAt})`,
    latest: sql<Date | null>`max(${chatSessions.updatedAt})`,
  })
  .from(chatSessions)
  .where(eq(chatSessions.userId, owner.id));

const [allMessageCount] = await db
  .select({ count: sql<number>`count(*)` })
  .from(chatMessages)
  .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
  .where(eq(chatSessions.userId, owner.id));

console.log(JSON.stringify({
  ownerFound: true,
  sessionsLast7Days: Number(sessionCount?.count ?? 0),
  messagesLast7Days: Number(messageCount?.count ?? 0),
  sessionsAllTime: Number(allSessionStats?.count ?? 0),
  messagesAllTime: Number(allMessageCount?.count ?? 0),
  earliestSessionAt: allSessionStats?.earliest?.toISOString?.() ?? null,
  latestSessionAt: allSessionStats?.latest?.toISOString?.() ?? null,
  cutoff: cutoff.toISOString(),
}));

process.exit(0);
