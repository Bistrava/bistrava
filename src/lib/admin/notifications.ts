import { z } from "zod";

export const adminNotificationCategorySchema = z.enum(["orders", "inquiries", "email"]);
export type AdminNotificationCategory = z.infer<typeof adminNotificationCategorySchema>;

export const adminNotificationsSchema = z.object({
  counts: z.object({
    orders: z.number().int().nonnegative(),
    inquiries: z.number().int().nonnegative(),
    email: z.number().int().nonnegative(),
  }),
  items: z.array(z.object({
    category: adminNotificationCategorySchema,
    entityId: z.uuid(),
    createdAt: z.iso.datetime({ offset: true }),
    label: z.string(),
    status: z.string(),
  })).max(12),
});
export type AdminNotifications = z.infer<typeof adminNotificationsSchema>;

export const markAdminNotificationsSchema = z.object({
  category: adminNotificationCategorySchema,
  entityIds: z.array(z.uuid()).min(1).max(100),
});
