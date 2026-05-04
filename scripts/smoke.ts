/**
 * Smoke test script for the Raygister MCP wrappers.
 *
 * Usage:
 *   export RAYGISTER_API_KEY=dk_your_key
 *   pnpm smoke
 *
 * Iterates through all six tools, picking the first project and lot it finds
 * to chain into the nested endpoints. Prints success or error per tool.
 */

import { createClient, RaygisterApiError } from "../src/client.js";
import { loadEnv } from "../src/env.js";

type Status = "ok" | "skip" | "fail";

interface Result {
	tool: string;
	status: Status;
	detail: string;
	durationMs: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function pickFirstId(payload: unknown): string | null {
	if (!isRecord(payload)) {
		return null;
	}
	const data = payload.data;
	if (!Array.isArray(data) || data.length === 0) {
		return null;
	}
	const first = data[0];
	if (!isRecord(first)) {
		return null;
	}
	const id = first.id;
	return typeof id === "string" ? id : null;
}

async function run<T>(
	tool: string,
	fn: () => Promise<T>,
	onSuccess: (value: T) => string
): Promise<Result> {
	const startedAt = Date.now();
	try {
		const value = await fn();
		return {
			tool,
			status: "ok",
			detail: onSuccess(value),
			durationMs: Date.now() - startedAt,
		};
	} catch (cause) {
		const status = cause instanceof RaygisterApiError ? `${cause.status}` : "error";
		const message = cause instanceof Error ? cause.message : String(cause);
		return {
			tool,
			status: "fail",
			detail: `[${status}] ${message}`,
			durationMs: Date.now() - startedAt,
		};
	}
}

async function main(): Promise<void> {
	const env = loadEnv();
	const client = createClient(env);
	const results: Result[] = [];

	process.stderr.write(`Running smoke against ${env.RAYGISTER_API_URL}\n\n`);

	const projectsResult = await run(
		"list_projects",
		() => client.get<unknown>("/v1/projects", { page: 1, per_page: 5 }),
		(value) => {
			const id = pickFirstId(value);
			return id ? `first project: ${id}` : "no projects returned";
		}
	);
	results.push(projectsResult);

	const projectId =
		projectsResult.status === "ok"
			? pickFirstId(
					await client.get<unknown>("/v1/projects", { page: 1, per_page: 5 }).catch(() => null)
				)
			: null;

	if (!projectId) {
		results.push({
			tool: "get_project",
			status: "skip",
			detail: "no project id available",
			durationMs: 0,
		});
		results.push({
			tool: "list_lots",
			status: "skip",
			detail: "no project id available",
			durationMs: 0,
		});
		results.push({
			tool: "list_locations",
			status: "skip",
			detail: "no project id available",
			durationMs: 0,
		});
		results.push({
			tool: "get_lot",
			status: "skip",
			detail: "no project id available",
			durationMs: 0,
		});
		results.push({
			tool: "list_specifications",
			status: "skip",
			detail: "no project id available",
			durationMs: 0,
		});
	} else {
		results.push(
			await run(
				"get_project",
				() => client.get<unknown>(`/v1/projects/${projectId}`),
				() => `project ${projectId} fetched`
			)
		);

		const lotsResult = await run(
			"list_lots",
			() => client.get<unknown>(`/v1/projects/${projectId}/lots`, { page: 1, per_page: 5 }),
			(value) => {
				const id = pickFirstId(value);
				return id ? `first lot: ${id}` : "no lots returned";
			}
		);
		results.push(lotsResult);

		results.push(
			await run(
				"list_locations",
				() => client.get<unknown>(`/v1/projects/${projectId}/locations`),
				() => "locations fetched"
			)
		);

		const lotId =
			lotsResult.status === "ok"
				? pickFirstId(
						await client
							.get<unknown>(`/v1/projects/${projectId}/lots`, {
								page: 1,
								per_page: 5,
							})
							.catch(() => null)
					)
				: null;

		if (!lotId) {
			results.push({
				tool: "get_lot",
				status: "skip",
				detail: "no lot id available",
				durationMs: 0,
			});
			results.push({
				tool: "list_specifications",
				status: "skip",
				detail: "no lot id available",
				durationMs: 0,
			});
		} else {
			results.push(
				await run(
					"get_lot",
					() => client.get<unknown>(`/v1/projects/${projectId}/lots/${lotId}`),
					() => `lot ${lotId} fetched`
				)
			);

			results.push(
				await run(
					"list_specifications",
					() =>
						client.get<unknown>(`/v1/projects/${projectId}/lots/${lotId}/specifications`, {
							page: 1,
							per_page: 5,
						}),
					() => "specifications fetched"
				)
			);
		}
	}

	let failed = 0;
	for (const result of results) {
		const icon = result.status === "ok" ? "OK  " : result.status === "skip" ? "SKIP" : "FAIL";
		const ms = result.durationMs > 0 ? ` (${result.durationMs}ms)` : "";
		process.stderr.write(`${icon}  ${result.tool}${ms}  ${result.detail}\n`);
		if (result.status === "fail") {
			failed += 1;
		}
	}

	process.stderr.write(`\n${results.length - failed}/${results.length} OK or skipped\n`);
	process.exit(failed > 0 ? 1 : 0);
}

main().catch((cause) => {
	const message = cause instanceof Error ? cause.message : String(cause);
	process.stderr.write(`fatal: ${message}\n`);
	process.exit(1);
});
