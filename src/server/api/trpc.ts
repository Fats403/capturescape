// src/server/api/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { adminAuth } from "@/lib/firebase-admin";
import { type UserRecord } from "firebase-admin/auth";

interface AuthedContext {
  user: UserRecord | null;
  headers: Headers;
}

export function getTokenFromCookie(headers: Headers): string | undefined {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return undefined;

  const tokenPrefix = "token=";
  const tokenStart = cookieHeader.indexOf(tokenPrefix);

  if (tokenStart === -1) return undefined;

  const valueStart = tokenStart + tokenPrefix.length;
  const valueEnd = cookieHeader.indexOf(";", valueStart);

  return valueEnd === -1
    ? cookieHeader.slice(valueStart)
    : cookieHeader.slice(valueStart, valueEnd);
}

export const createTRPCContext = async (opts: {
  headers: Headers;
}): Promise<AuthedContext> => {
  const token = getTokenFromCookie(opts.headers);
  let user: UserRecord | null = null;

  if (token) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(token, true);
      user = await adminAuth.getUser(decodedClaims.uid);
    } catch (e) {
      // Token verification failed, user remains null
      console.error("Error verifying session cookie:", e);
    }
  }

  return {
    user,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Middleware that checks if user is authenticated
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
