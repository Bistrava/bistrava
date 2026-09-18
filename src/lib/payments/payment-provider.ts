export type Money = {
  amountCents: number;
  currency: "EUR";
};

export type PaymentStatus =
  | "pending"
  | "requires_action"
  | "authorized"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type PaymentSession = {
  providerReference: string;
  redirectUrl: string;
  expiresAt?: string;
};

export type VerifiedPaymentEvent = {
  eventId: string;
  providerReference: string;
  status: PaymentStatus;
  amount: Money;
  occurredAt: string;
  rawEvent: unknown;
};

export interface PaymentProvider {
  readonly name: string;
  createPaymentSession(input: {
    orderId: string;
    orderReference: string;
    amount: Money;
    successUrl: string;
    cancelUrl: string;
    idempotencyKey: string;
  }): Promise<PaymentSession>;
  verifyWebhook(request: Request): Promise<VerifiedPaymentEvent>;
  refund(input: {
    paymentReference: string;
    amount: Money;
    idempotencyKey: string;
    reason?: string;
  }): Promise<{ refundReference: string; status: PaymentStatus }>;
}
