import type { Env } from "./env.js";
import { logger } from "./logger.js";

export class RaygisterApiError extends Error {
	readonly status: number;
	readonly body: unknown;

	constructor(message: string, status: number, body: unknown) {
		super(message);
		this.name = "RaygisterApiError";
		this.status = status;
		this.body = body;
	}
}

export type QueryValue = string | number | boolean | undefined | null;
export type Query = Record<string, QueryValue>;

export interface RaygisterClient {
	get<T = unknown>(path: string, query?: Query): Promise<T>;
}

const USER_AGENT = "raygister-mcp/0.1.0";

function buildUrl(baseUrl: string, path: string, query?: Query): string {
	const trimmedBase = baseUrl.replace(/\/+$/, "");
	const trimmedPath = path.startsWith("/") ? path : `/${path}`;
	const url = new URL(`${trimmedBase}${trimmedPath}`);
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value === undefined || value === null) {
				continue;
			}
			url.searchParams.set(key, String(value));
		}
	}
	return url.toString();
}

function describeError(status: number, body: unknown): string {
	if (body && typeof body === "object" && "error" in body) {
		const message = (body as { error?: unknown }).error;
		if (typeof message === "string" && message.length > 0) {
			return `Raygister API ${status}: ${message}`;
		}
	}
	return `Raygister API ${status}`;
}

export function createClient(env: Env): RaygisterClient {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${env.RAYGISTER_API_KEY}`,
		Accept: "application/json",
		"User-Agent": USER_AGENT,
	};

	return {
		async get<T>(path: string, query?: Query): Promise<T> {
			const url = buildUrl(env.RAYGISTER_API_URL, path, query);
			let response: Response;
			try {
				response = await fetch(url, { method: "GET", headers });
			} catch (cause) {
				const message = cause instanceof Error ? cause.message : String(cause);
				logger.error("network error", { url, message });
				throw new RaygisterApiError(`Network error: ${message}`, 0, null);
			}

			const text = await response.text();
			let body: unknown = null;
			if (text.length > 0) {
				try {
					body = JSON.parse(text);
				} catch {
					body = text;
				}
			}

			if (!response.ok) {
				const message = describeError(response.status, body);
				logger.warn("api error", { url, status: response.status, message });
				throw new RaygisterApiError(message, response.status, body);
			}

			return body as T;
		},
	};
}
