/**
 * Smoke test of the built server against a live API key.
 *
 * Usage:
 *   export RAYGISTER_API_KEY=dk_your_key
 *   export RAYGISTER_API_URL=http://localhost:3000/api   # optional
 *   pnpm smoke
 *
 * Starts dist/index.js over stdio like an MCP client would, then calls every
 * tool on the first project and lot it finds. The server checks each answer
 * against the tool's output schema, so a drift between the API and the
 * schemas fails here.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type Args = Record<string, unknown>;

const client = new Client({ name: "raygister-mcp-smoke", version: "0.0.0" });
let failed = 0;

async function call(name: string, args: Args): Promise<Args | null> {
	const startedAt = Date.now();
	const result = await client.callTool({ arguments: args, name });
	const ms = Date.now() - startedAt;
	if (result.isError) {
		failed += 1;
		const content = result.content as Array<{ text?: string }>;
		process.stderr.write(`FAIL  ${name} (${ms}ms)  ${content[0]?.text ?? ""}\n`);
		return null;
	}
	process.stderr.write(`OK    ${name} (${ms}ms)\n`);
	return (result.structuredContent ?? {}) as Args;
}

function skip(name: string, reason: string): void {
	process.stderr.write(`SKIP  ${name}  ${reason}\n`);
}

function firstId(list: unknown): string | null {
	const first = Array.isArray(list) ? (list[0] as Args | undefined) : undefined;
	return typeof first?.id === "string" ? first.id : null;
}

async function main(): Promise<void> {
	if (!process.env.RAYGISTER_API_KEY) {
		throw new Error("Set RAYGISTER_API_KEY first.");
	}
	const env: Record<string, string> = { RAYGISTER_API_KEY: process.env.RAYGISTER_API_KEY };
	if (process.env.RAYGISTER_API_URL) {
		env.RAYGISTER_API_URL = process.env.RAYGISTER_API_URL;
	}
	process.stderr.write(`Running smoke against ${env.RAYGISTER_API_URL ?? "the default API"}\n\n`);

	await client.connect(
		new StdioClientTransport({ args: ["dist/index.js"], command: process.execPath, env })
	);
	const { tools } = await client.listTools();
	process.stderr.write(`${tools.length} tools: ${tools.map((tool) => tool.name).join(", ")}\n\n`);

	const projects = await call("list_projects", { per_page: 5 });
	const projectId = firstId(projects?.projects);
	if (!projectId) {
		skip("project tools", "no project returned");
	} else {
		await call("get_project", { project_id: projectId });
		await call("get_project_totals", { project_id: projectId });
		await call("list_locations", { project_id: projectId });
		const lots = await call("list_lots", { per_page: 5, project_id: projectId });
		const lotId = firstId(lots?.lots);
		if (!lotId) {
			skip("lot tools", "no lot returned");
		} else {
			await call("get_lot", { lot_id: lotId, project_id: projectId });
			await call("list_specifications", { lot_id: lotId, per_page: 5, project_id: projectId });
		}
	}

	await client.close();
	process.stderr.write(failed > 0 ? `\n${failed} tool(s) failed\n` : "\nAll tools answered\n");
	process.exit(failed > 0 ? 1 : 0);
}

main().catch((cause) => {
	const message = cause instanceof Error ? cause.message : String(cause);
	process.stderr.write(`fatal: ${message}\n`);
	process.exit(1);
});
