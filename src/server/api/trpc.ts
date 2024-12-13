// src/server/api/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { adminAuth } from "@/lib/firebaseAdmin";
import { type DecodedIdToken } from "firebase-admin/auth";

interface AuthedContext {
  user: DecodedIdToken | null;
  headers: Headers;
}

export const createTRPCContext = async (opts: {
  headers: Headers;
}): Promise<AuthedContext> => {
  const authHeader = opts.headers.get("authorization");

  if (!authHeader) {
    return { user: null, headers: opts.headers };
  }

  try {
    // Verify the Firebase ID token
    const token = authHeader.replace("Bearer ", "");
    const decodedToken = await adminAuth.verifyIdToken(token);

    return {
      user: decodedToken,
      ...opts,
    };
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return { user: null, ...opts };
  }
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
