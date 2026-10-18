/**
 * Subscription Products Configuration
 * Status: DISABLED (waiting for activation with prices and Stripe IDs)
 * 
 * When activated, add:
 * - Stripe Product IDs and Price IDs
 * - Actual prices in PLN/USD
 * - Enable the products in the database
 */

export const SUBSCRIPTION_PRODUCTS = {
  monthly: {
    name: "Stefan Monthly",
    billingCycle: "monthly" as const,
    description: "Monthly subscription to Stefan legal assistant",
    features: [
      "Unlimited chat with legal expert",
      "Document analysis (up to 50 documents/month)",
      "Template library access",
      "Deep Research mode",
      "Priority support",
    ],
    // To be filled when activated:
    stripeProductId: null as string | null,
    stripePriceId: null as string | null,
    priceUSD: null as number | null, // e.g., 9.99
    pricePLN: null as number | null, // e.g., 39.99
  },
  yearly: {
    name: "Stefan Yearly",
    billingCycle: "yearly" as const,
    description: "Yearly subscription to Stefan legal assistant (save 20%)",
    features: [
      "Unlimited chat with legal expert",
      "Document analysis (unlimited)",
      "Template library access",
      "Deep Research mode",
      "Priority support",
      "Annual discount (20% savings)",
    ],
    // To be filled when activated:
    stripeProductId: null as string | null,
    stripePriceId: null as string | null,
    priceUSD: null as number | null, // e.g., 95.88 (9.99 * 12 - 20%)
    pricePLN: null as number | null, // e.g., 383.92
  },
};

/**
 * Payment Methods Configuration
 * Status: DISABLED (waiting for activation)
 */
export const PAYMENT_METHODS = {
  blik: {
    name: "BLIK",
    description: "Polish instant payment system",
    enabled: false, // Disabled by default
    icon: "💳",
  },
  paypal: {
    name: "PayPal",
    description: "PayPal payment method",
    enabled: false, // Disabled by default
    icon: "🅿️",
  },
  card: {
    name: "Credit/Debit Card",
    description: "Visa, Mastercard, and other cards",
    enabled: false, // Disabled by default
    icon: "💳",
  },
};

/**
 * Activation Checklist
 * 
 * To activate subscriptions:
 * 1. Set prices in SUBSCRIPTION_PRODUCTS (USD and PLN)
 * 2. Create Stripe Products and Prices
 * 3. Add Stripe Product IDs and Price IDs to SUBSCRIPTION_PRODUCTS
 * 4. Enable payment methods in PAYMENT_METHODS
 * 5. Set isActive: true in database for subscription plans
 * 6. Test with Stripe test cards
 * 7. Deploy to production
 * 
 * Test card: 4242 4242 4242 4242
 */
