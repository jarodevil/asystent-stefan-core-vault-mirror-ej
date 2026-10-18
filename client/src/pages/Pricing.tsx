import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Lock } from "lucide-react";
import StefanLayout from "@/components/StefanLayout";
import { toast } from "sonner";

/**
 * Pricing Page
 * Status: DISABLED (waiting for activation)
 * 
 * Features:
 * - Monthly and yearly subscription plans
 * - BLIK and PayPal payment methods
 * - All functionality disabled until activation
 */

export default function Pricing() {
  const isSubscriptionActive = false; // Set to true when activating

  const plans = [
    {
      name: "Monthly",
      billingCycle: "monthly",
      price: "TBD", // To be filled when activated
      description: "Perfect for occasional legal consultations",
      features: [
        "Unlimited chat with legal expert",
        "Document analysis (up to 50 documents/month)",
        "Template library access",
        "Deep Research mode",
        "Priority support",
      ],
      cta: "Subscribe Monthly",
    },
    {
      name: "Yearly",
      billingCycle: "yearly",
      price: "TBD", // To be filled when activated
      description: "Best value - save 20% compared to monthly",
      features: [
        "Unlimited chat with legal expert",
        "Document analysis (unlimited)",
        "Template library access",
        "Deep Research mode",
        "Priority support",
        "Annual discount (20% savings)",
      ],
      cta: "Subscribe Yearly",
      highlighted: true,
    },
  ];

  const handleSubscribe = (billingCycle: string) => {
    if (!isSubscriptionActive) {
      toast.info("Subscription coming soon", {
        description: "Subscription feature is currently being prepared. Stay tuned!",
      });
      return;
    }

    // TODO: Implement checkout flow
    toast.info("Redirecting to checkout...", {
      description: `Preparing ${billingCycle} subscription checkout`,
    });
  };

  return (
    <StefanLayout>
      <div className="container max-w-6xl py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your legal consultation needs. All plans include access to Stefan's expert AI.
          </p>
        </div>

        {/* Subscription Status Badge */}
        {!isSubscriptionActive && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <p className="text-sm text-amber-800">
              <Lock className="w-4 h-4 inline mr-2" />
              Subscription feature coming soon. Stefan remains free for now.
            </p>
          </div>
        )}

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.billingCycle}
              className={`relative transition-all ${
                plan.highlighted
                  ? "border-primary shadow-lg scale-105 md:scale-100"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div>
                  <div className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.billingCycle === "monthly"
                      ? "per month, billed monthly"
                      : "per year, billed annually"}
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.billingCycle)}
                  disabled={!isSubscriptionActive}
                >
                  {!isSubscriptionActive ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Coming Soon
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Methods Info */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              When subscriptions are activated, you'll be able to pay using:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">💳</div>
                <div>
                  <p className="font-semibold">BLIK</p>
                  <p className="text-sm text-muted-foreground">
                    Polish instant payment
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl">🅿️</div>
                <div>
                  <p className="font-semibold">PayPal</p>
                  <p className="text-sm text-muted-foreground">
                    Secure payment service
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl">💳</div>
                <div>
                  <p className="font-semibold">Credit Card</p>
                  <p className="text-sm text-muted-foreground">
                    Visa, Mastercard, etc.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground text-sm">
                Stefan is currently free for all users. Subscriptions will provide additional features and priority support.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-sm">
                We accept BLIK, PayPal, and major credit cards (Visa, Mastercard, etc.).
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-muted-foreground text-sm">
                We offer a 7-day money-back guarantee if you're not satisfied with your subscription.
              </p>
            </div>
          </div>
        </div>
      </div>
    </StefanLayout>
  );
}
