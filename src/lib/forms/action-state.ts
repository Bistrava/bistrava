export type FormActionState = {
  status: "idle" | "success" | "error";
  message: string;
  redirectUrl?: string;
  fieldErrors?: Record<string, string[]>;
};
export type AdminProductActionState = Omit<FormActionState, "redirectUrl"> & {
  redirectUrl?: `/admin/izdelki/${string}`;
  updatedAt?: string;
};
/** clientSecret is returned only for card orders, so the browser can confirm the Stripe payment. */
export type CheckoutActionState = FormActionState & { clientSecret?: string };
export type InquiryActionState = FormActionState;
export const initialAdminProductActionState: AdminProductActionState = { status: "idle", message: "" };
export const initialCheckoutState: CheckoutActionState = { status: "idle", message: "" };
export const initialInquiryState: InquiryActionState = { status: "idle", message: "" };
