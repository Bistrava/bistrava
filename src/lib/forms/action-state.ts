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
export type CheckoutActionState = FormActionState;
export type InquiryActionState = FormActionState;
export const initialAdminProductActionState: AdminProductActionState = { status: "idle", message: "" };
export const initialCheckoutState: CheckoutActionState = { status: "idle", message: "" };
export const initialInquiryState: InquiryActionState = { status: "idle", message: "" };
