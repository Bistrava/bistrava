import { z } from "zod";

export const adminSignInSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});

export type PasswordActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const adminRecoveryEmailSchema = adminSignInSchema.pick({ email: true });

export const adminNewPasswordSchema = z.object({
  password: z.string().min(12).max(128),
  confirmPassword: z.string().min(12).max(128),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Les deux mots de passe doivent être identiques.",
});

export const adminRecoveryProofSchema = z.object({
  code: z.string().min(20).max(512).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  tokenHash: z.string().min(20).max(512).regex(/^[a-zA-Z0-9_-]+$/).optional(),
}).refine((value) => Boolean(value.code) !== Boolean(value.tokenHash));
