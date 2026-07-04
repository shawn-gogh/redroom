import { getNotifications, markNotificationRead } from "../db";
import { publicProcedure, protectedProcedure, router } from "./trpc";
import { z } from "zod";

export const systemRouter = router({
  health: publicProcedure.query(() => ({ status: "ok", timestamp: new Date().toISOString() })),

  notifications: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(200).optional() }).optional())
    .query(({ input }) => getNotifications(input?.limit)),

  markNotificationRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationRead(input.id);
      return { success: true };
    }),
});
