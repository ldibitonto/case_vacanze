import { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mockProvider";

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER || "mock";

  switch (provider) {
    case "mock":
      return new MockPaymentProvider();
    case "stripe":
      // TODO: creare src/lib/payments/stripeProvider.ts che implementa PaymentProvider
      // usando le chiavi STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET (anche in test mode).
      throw new Error(
        "PAYMENT_PROVIDER=stripe ma stripeProvider.ts non è ancora implementato."
      );
    default:
      throw new Error(`Payment provider sconosciuto: ${provider}`);
  }
}

export * from "./types";
