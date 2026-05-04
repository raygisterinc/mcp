import { createHash } from "node:crypto";
import { PostHog } from "posthog-node";
import type { Env } from "./env.js";
import { logger } from "./logger.js";

export interface ToolEvent {
	tool: string;
	success: boolean;
	durationMs: number;
	errorCode?: number | string;
}

export interface Telemetry {
	track(event: ToolEvent): void;
	shutdown(): Promise<void>;
}

const NOOP: Telemetry = {
	track() {
		// no-op
	},
	async shutdown() {
		// no-op
	},
};

/**
 * Stable, non-reversible identifier derived from the API key.
 * Lets us count distinct installs without storing or transmitting the key itself,
 * and without making any network call at startup.
 */
function distinctIdFromKey(apiKey: string): string {
	return createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
}

export function createTelemetry(env: Env): Telemetry {
	if (!env.POSTHOG_API_KEY) {
		return NOOP;
	}

	let client: PostHog;
	try {
		client = new PostHog(env.POSTHOG_API_KEY, {
			host: env.POSTHOG_HOST,
			flushAt: 1,
			flushInterval: 5000,
		});
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : String(cause);
		logger.warn("telemetry disabled, init failed", { message });
		return NOOP;
	}

	const distinctId = distinctIdFromKey(env.RAYGISTER_API_KEY);

	return {
		track(event) {
			try {
				client.capture({
					distinctId,
					event: "raygister_mcp_tool_call",
					properties: {
						tool: event.tool,
						success: event.success,
						duration_ms: event.durationMs,
						error_code: event.errorCode,
						mcp_version: "0.1.0",
					},
				});
			} catch (cause) {
				const message = cause instanceof Error ? cause.message : String(cause);
				logger.warn("telemetry capture failed", { message });
			}
		},
		async shutdown() {
			try {
				await client.shutdown();
			} catch (cause) {
				const message = cause instanceof Error ? cause.message : String(cause);
				logger.warn("telemetry shutdown failed", { message });
			}
		},
	};
}
