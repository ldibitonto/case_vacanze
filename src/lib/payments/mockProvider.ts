import {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  PaymentStatus,
} from "./types";

// Provider finto: non chiama nessun servizio esterno.
// - createCheckout genera una pagina di conferma locale (/mock-checkout) invece
//   che una vera pagina Stripe/PayPal.
// - verifyPayment ritorna sempre "paid": simula un pagamento andato a buon fine,
//   utile per sviluppare tutto il flusso di prenotazione senza credenziali reali.
//
// Quando avrai un account Stripe (anche solo in modalità test, con le chiavi
// sk_test_... — non serve un account business verificato per quello), crea
// stripeProvider.ts con la stessa interfaccia PaymentProvider e cambia
// PAYMENT_PROVIDER=stripe nel .env: il resto del codice non cambia.

export class MockPaymentProvider implements PaymentProvider {
  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const reference = `mock_${params.bookingId}_${Date.now()}`;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const query = new URLSearchParams({
      ref: reference,
      amount: String(params.amount),
      bookingId: params.bookingId,
      currency: params.currency,
      description: params.description,
      email: params.customerEmail,
    });
    const checkoutUrl = `${baseUrl}/mock-checkout?${query.toString()}`;

    return { checkoutUrl, reference };
  }

  async verifyPayment(_reference: string): Promise<PaymentStatus> {
    // In un provider reale qui interrogheresti l'API (es. stripe.checkout.sessions.retrieve).
    // Il mock conferma sempre il pagamento.
    return "paid";
  }
}
