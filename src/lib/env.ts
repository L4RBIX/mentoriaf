function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(
      `Missing required environment variable: ${name}. Copy .env.example → .env.local and fill it in.`
    );
    this.name = "MissingEnvError";
  }
}

export function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) throw new MissingEnvError(name);
  return value;
}

export const env = {
  supabaseUrl: () => readEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: () => readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseStorageBucket: () =>
    readEnv("SUPABASE_STORAGE_BUCKET") ?? "writeoff-photos",
  databaseUrl: () => readEnv("DATABASE_URL"),
  geminiApiKey: () => readEnv("GEMINI_API_KEY"),
  geminiModel: () => readEnv("GEMINI_MODEL") ?? "gemini-2.5-flash",
  visionProvider: (): "gemini" | "local" =>
    readEnv("VISION_PROVIDER") === "gemini" ? "gemini" : "local",
  visionTimeoutMs: () => {
    const raw = readEnv("VISION_TIMEOUT_MS");
    const parsed = raw ? Number(raw) : 30000;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 30000;
  },
  iikoMode: (): "real" | "sandbox" =>
    readEnv("IIKO_MODE") === "real" ? "real" : "sandbox",
  iikoBaseUrl: () => readEnv("IIKO_BASE_URL"),
  iikoLogin: () => readEnv("IIKO_LOGIN"),
  iikoPassword: () => readEnv("IIKO_PASSWORD"),
  iikoTokenCacheEnabled: () => readEnv("IIKO_TOKEN_CACHE_ENABLED") !== "false",
  demoBaseUrl: () => readEnv("DEMO_BASE_URL") ?? "http://localhost:3000",
  autoRejectStrongDuplicate: () =>
    readEnv("AUTO_REJECT_STRONG_DUPLICATE") === "true",
} as const;

export const isGeminiConfigured = (): boolean => Boolean(env.geminiApiKey());

export const isGeminiVisionReady = (): boolean =>
  env.visionProvider() === "gemini" && isGeminiConfigured();

export const isIikoRealConfigured = (): boolean =>
  Boolean(env.iikoBaseUrl() && env.iikoLogin() && env.iikoPassword());
