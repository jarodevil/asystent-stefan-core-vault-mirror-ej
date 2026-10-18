/**
 * Subscription Handlers
 * Status: DISABLED (waiting for activation)
 * 
 * Handles:
 * - Creating checkout sessions
 * - Processing webhook events
 * - Managing subscriptions
 * - Handling cancellations
 */

import Stripe from "stripe";
import { getDb } from "../db";
import { payments, userSubscriptions, subscriptionPlans } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

/**
 * Create Stripe Checkout Session
 * Status: DISABLED
 */
export async function createCheckoutSession(
  userId: number,
  userEmail: string,
  userName: string,
  planId: number,
  successUrl: string,
  cancelUrl: string
) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get plan details
  const plan = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, planId))
    .limit(1);

  if (!plan || plan.length === 0) {
    throw new Error("Plan not found");
  }

  const selectedPlan = plan[0];

  if (!selectedPlan.isActive || !selectedPlan.stripePriceId) {
    throw new Error("Plan is not active or not configured");
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"], // Will add blik, paypal when activated
    line_items: [
      {
        price: selectedPlan.stripePriceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      plan_id: planId.toString(),
      customer_email: userEmail,
      customer_name: userName,
    },
    allow_promotion_codes: true,
  });

  return session;
}

/**
 * Handle Checkout Session Completed
 * Status: DISABLED
 */
export async function handleCheckoutSessionCompleted(
  event: Stripe.Event
) {
  const session = event.data.object as Stripe.Checkout.Session;

  const userId = parseInt(session.client_reference_id || "0");
  const planId = parseInt(session.metadata?.plan_id || "0");

  if (!userId || !planId) {
    console.error("Missing userId or planId in session metadata");
    return;
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create user subscription record
  await db.insert(userSubscriptions).values({
    userId,
    planId,
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: session.subscription as string,
    status: "active",
    startDate: new Date(),
    isActive: false, // Keep disabled until activated
  });

  console.log(`Subscription created for user ${userId}, plan ${planId}`);
}

/**
 * Handle Invoice Paid
 * Status: DISABLED
 */
export async function handleInvoicePaid(
  event: Stripe.Event
) {
  const invoice = event.data.object as Stripe.Invoice;

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Find subscription by Stripe subscription ID
  const subscription = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeSubscriptionId, (invoice as any).subscription as string))
    .limit(1);

  if (!subscription || subscription.length === 0) {
    console.error("Subscription not found for invoice");
    return;
  }

  const userSub = subscription[0];

  // Create payment record
  await db.insert(payments).values({
    userId: userSub.userId,
    subscriptionId: userSub.id,
    stripePaymentIntentId: (invoice as any).payment_intent as string | undefined,
    stripeInvoiceId: invoice.id,
    status: "succeeded",
    isActive: false, // Keep disabled until activated
  });

  console.log(`Payment recorded for subscription ${userSub.id}`);
}

/**
 * Handle Customer Subscription Deleted
 * Status: DISABLED
 */
export async function handleCustomerSubscriptionDeleted(
  event: Stripe.Event
) {
  const subscription = event.data.object as Stripe.Subscription;

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Find and update user subscription
  await db
    .update(userSubscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      isActive: false,
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));

  console.log(`Subscription ${subscription.id} cancelled`);
}

/**
 * Webhook Event Handler
 * Status: DISABLED
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  // Test event detection
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return { verified: true };
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event);
      break;
    case "customer.subscription.deleted":
      await handleCustomerSubscriptionDeleted(event);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return { received: true };
}
