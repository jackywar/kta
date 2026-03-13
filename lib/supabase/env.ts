import { z } from "zod";

const browserEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1)
});

const ssrEnvSchema = browserEnvSchema;

const adminEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  APP_URL: z.string().url()
});

function formatZodEnvError(prefix: string, err: z.ZodError) {
  const flat = err.flatten();
  const fieldMessages = Object.entries(flat.fieldErrors)
    .flatMap(([key, msgs]) => (msgs ?? []).map((m) => `${key}: ${m}`))
    .join(", ");
  const formMessages = flat.formErrors.join(", ");
  const details = [fieldMessages, formMessages].filter(Boolean).join(", ");
  return `${prefix}${details ? ` ${details}` : ""}`;
}

export function getBrowserEnv() {
  const parsed = browserEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  });

  if (!parsed.success) {
    throw new Error(
      formatZodEnvError("Missing/invalid browser env:", parsed.error)
    );
  }

  return parsed.data;
}

export function getSsrEnv() {
  const parsed = ssrEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  });

  if (!parsed.success) {
    throw new Error(
      formatZodEnvError("Missing/invalid SSR env:", parsed.error)
    );
  }

  return parsed.data;
}

export function getAdminEnv() {
  const parsed = adminEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    APP_URL: process.env.APP_URL
  });

  if (!parsed.success) {
    throw new Error(
      formatZodEnvError("Missing/invalid admin env:", parsed.error)
    );
  }

  return parsed.data;
}