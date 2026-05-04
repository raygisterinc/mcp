import { z } from "zod";

const EnvSchema = z.object({
	RAYGISTER_API_KEY: z
		.string({ required_error: "RAYGISTER_API_KEY is required" })
		.min(1, "RAYGISTER_API_KEY cannot be empty")
		.regex(/^dk_/, "RAYGISTER_API_KEY must start with 'dk_'"),
	RAYGISTER_API_URL: z
		.string()
		.url("RAYGISTER_API_URL must be a valid URL")
		.default("https://app.raygister.com/api"),
	POSTHOG_API_KEY: z.string().optional(),
	POSTHOG_HOST: z.string().url().default("https://eu.posthog.com"),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
	const parsed = EnvSchema.safeParse(process.env);
	if (!parsed.success) {
		const issues = parsed.error.issues
			.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
			.join("\n");
		throw new Error(`Invalid environment configuration:\n${issues}`);
	}
	return parsed.data;
}
