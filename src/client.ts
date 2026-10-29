import type { Env } from "./env.js";
import { logger } from "./logger.js";
import { VERSION } from "./version.js";

const TIMEOUT_MS = 30_000;

/**
 * An API refusal or failure. `code` is the stable code of the API's
 * `{ "error": { "code", "message" } }` body (unauthorized, moe_access_ended,
 * not_found, internal_error), or network_error when the API was not reached.
 * `message` is written for the assistant reading the tool result.
 */
export class RaygisterApiError extends Error {
	readonly code: string;
	readonly status: number;

	constructor(message: string, code: string, status: number) {
		super(message);
		this.name = "RaygisterApiError";
		this.code = code;
		this.status = status;
	}
}

export type QueryValue = string | number | boolean | undefined | null;
export type Query = Record<string, QueryValue>;

export interface RaygisterClient {
	/** The parsed JSON body of a successful GET; throws a RaygisterApiError otherwise. */
	get(path: string, query?: Query): Promise<unknown>;
}

export interface Pagination {
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildUrl(baseUrl: string, path: string, query?: Query): string {
	const trimmedBase = baseUrl.replace(/\/+$/, "");
	const trimmedPath = path.startsWith("/") ? path : `/${path}`;
	const url = new URL(`${trimmedBase}${trimmedPath}`);
	for (const [key, value] of Object.entries(query ?? {})) {
		if (value !== undefined && value !== null) {
			url.searchParams.set(key, String(value));
		}
	}
	return url.toString();
}

function readErrorBody(body: unknown): { code: string | null; message: string | null } {
	if (isRecord(body) && isRecord(body.error)) {
		const { code, message } = body.error;
		return {
			code: typeof code === "string" ? code : null,
			message: typeof message === "string" ? message : null,
		};
	}
	return { code: null, message: null };
}

function explain(status: number, code: string, apiMessage: string | null): string {
	switch (code) {
		case "unauthorized":
			return "The Raygister API refused the key: it is missing, invalid or revoked. Create a key in Raygister under Settings > API keys and set it as RAYGISTER_API_KEY.";
		case "moe_access_ended":
			return "The organization's access to the Raygister project manager space has ended, so its API keys are refused. Renewing the subscription restores access.";
		case "not_found":
			return "Not found: no item with this id in the organization, or it was deleted. List the parent items to find a valid id.";
		case "internal_error":
			return "The Raygister API failed on its side. Try again in a moment.";
		default:
			return `The Raygister API answered ${status}${apiMessage ? `: ${apiMessage}` : ""}.`;
	}
}

function codeFromStatus(status: number): string {
	if (status === 401) {
		return "unauthorized";
	}
	if (status === 404) {
		return "not_found";
	}
	return status >= 500 ? "internal_error" : "unknown";
}

export function createClient(env: Env): RaygisterClient {
	const headers: Record<string, string> = {
		Accept: "application/json",
		Authorization: `Bearer ${env.RAYGISTER_API_KEY}`,
		"User-Agent": `raygister-mcp/${VERSION}`,
	};

	return {
		async get(path, query) {
			const url = buildUrl(env.RAYGISTER_API_URL, path, query);
			let response: Response;
			try {
				response = await fetch(url, {
					headers,
					method: "GET",
					signal: AbortSignal.timeout(TIMEOUT_MS),
				});
			} catch (cause) {
				const reason =
					cause instanceof Error && cause.name === "TimeoutError"
						? `no answer after ${TIMEOUT_MS / 1000} s`
						: cause instanceof Error
							? cause.message
							: String(cause);
				logger.error("network error", { url, reason });
				throw new RaygisterApiError(
					`Could not reach the Raygister API at ${env.RAYGISTER_API_URL}: ${reason}.`,
					"network_error",
					0
				);
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
				const error = readErrorBody(body);
				const code = error.code ?? codeFromStatus(response.status);
				logger.warn("api error", { url, status: response.status, code });
				throw new RaygisterApiError(
					explain(response.status, code, error.message),
					code,
					response.status
				);
			}

			return body;
		},
	};
}

function unexpected(path: string): Error {
	return new Error(`Unexpected answer from the Raygister API for ${path}: no data.`);
}

/** The `data` of a single resource or a list that is not paginated. */
export async function getData(client: RaygisterClient, path: string): Promise<unknown> {
	const body = await client.get(path);
	if (!(isRecord(body) && "data" in body)) {
		throw unexpected(path);
	}
	return body.data;
}

/** One page of a paginated list. */
export async function getPage(
	client: RaygisterClient,
	path: string,
	query: Query
): Promise<{ data: unknown[]; pagination: Pagination }> {
	const body = await client.get(path, query);
	if (!(isRecord(body) && Array.isArray(body.data) && isRecord(body.pagination))) {
		throw unexpected(path);
	}
	return { data: body.data, pagination: body.pagination as unknown as Pagination };
}
