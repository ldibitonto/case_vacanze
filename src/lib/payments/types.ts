// Interfaccia comune: sia il mock che (in futuro) Stripe/PayPal la implementano.
// Il resto dell'app parla solo con questa interfaccia, mai con l'SDK specifico:
// così il giorno che avrai un account Stripe vero, cambi solo il file del provider.

export interface CreateCheckoutParams {
  bookingId: string;
  amount: number; // in centesimi, es. 15000 = 150.00 EUR
  currency: string; // es. "EUR"
  customerEmail: string;
  description: string;
}

export interface CheckoutResult {
  checkoutUrl: string; // dove reindirizzare l'utente per pagare
  reference: string; // id della sessione di pagamento, salvato su Booking.paymentRef
}

export type PaymentStatus = "pending" | "paid" | "failed";

export interface PaymentProvider {
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>;
  verifyPayment(reference: string): Promise<PaymentStatus>;
}
