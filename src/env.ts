import { z } from "zod";

const EnvSchema = z.object({
	RAYGISTER_API_KEY: z
		.string({
			error: "RAYGISTER_API_KEY is required: create a key in Raygister under Settings > API keys",
		})
		.trim()
		.regex(/^dk_/, "RAYGISTER_API_KEY must start with 'dk_'"),
	RAYGISTER_API_URL: z
		.url({ error: "RAYGISTER_API_URL must be a valid URL" })
		.default("https://app.raygister.com/api"),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
	const parsed = EnvSchema.safeParse(source);
	if (!parsed.success) {
		const issues = parsed.error.issues
			.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
			.join("\n");
		throw new Error(`Invalid environment configuration:\n${issues}`);
	}
	return parsed.data;
}
