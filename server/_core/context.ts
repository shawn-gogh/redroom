import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { COOKIE_NAME } from "@shared/const";
import { getUserByOpenId } from "../db";
import { sdk } from "./sdk";
import type { User } from "../../drizzle/schema";

export interface TrpcContext {
  user: User | null;
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
}

export async function createContext({ req, res }: CreateExpressContextOptions): Promise<TrpcContext> {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return { user: null, req, res };

  const session = await sdk.verifySessionToken(token);
  if (!session) return { user: null, req, res };

  const user = await getUserByOpenId(session.openId);
  return { user: user ?? null, req, res };
}
