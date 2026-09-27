import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 characters"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  RESEND_API_KEY: z.string().default("re_dev_placeholder"),
  EMAIL_FROM_DOMAIN: z.string().default("mail.flowvo.app"),
  CRON_SECRET: z.string().default("dev-cron-secret"),
  STAGING_EMAIL_OVERRIDE: z.string().email().optional().or(z.literal("")),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsedEnv = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM_DOMAIN: process.env.EMAIL_FROM_DOMAIN,
  CRON_SECRET: process.env.CRON_SECRET,
  STAGING_EMAIL_OVERRIDE: process.env.STAGING_EMAIL_OVERRIDE,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  if (process.env.NODE_ENV === "production") {
    throw new Error("Invalid environment configuration. Refusing to start in production.");
  }
}

export const env = parsedEnv.success ? parsedEnv.data : (process.env as unknown as z.infer<typeof envSchema>);
