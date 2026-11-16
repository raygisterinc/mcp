import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";
import { type Query, RaygisterApiError, type RaygisterClient } from "../src/client.js";
import { createServer } from "../src/server.js";
import {
	GROUP_ID,
	group,
	LOT_ID,
	location,
	lot,
	PROJECT_ID,
	page,
	project,
	specification,
	supply,
	totals,
	trade,
	workItem,
} from "./fixtures.js";

interface Call {
	path: string;
	query?: Query;
}

/** Answers each API path with a body, or throws the error given for it. */
function fakeApi(answers: Record<string, unknown>) {
	const calls: Call[] = [];
	const api: RaygisterClient = {
		get(path, query) {
			calls.push({ path, query });
			if (!(path in answers)) {
				return Promise.reject(new RaygisterApiError("Not found.", "not_found", 404));
			}
			const answer = answers[path];
			return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
		},
	};
	return { api, calls };
}

const open: Client[] = [];

async function connect(api: RaygisterClient): Promise<Client> {
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
	await createServer(api).connect(serverTransport);
	const client = new Client({ name: "test", version: "0.0.0" });
	await client.connect(clientTransport);
	open.push(client);
	return client;
}

function text(result: Awaited<ReturnType<Client["callTool"]>>): string {
	const [first] = result.content as Array<{ text: string }>;
	return first?.text ?? "";
}

afterEach(async () => {
	for (const client of open.splice(0)) {
		await client.close();
	}
});

describe("tools", () => {
	it("are fifteen, read-only, each with an output schema", async () => {
		const client = await connect(fakeApi({}).api);

		const { tools } = await client.listTools();

		expect(tools.map((tool) => tool.name).sort()).toEqual([
			"get_library_group",
			"get_lot",
			"get_project",
			"get_project_totals",
			"get_supply",
			"get_trade",
			"get_work_item",
			"list_library_groups",
			"list_locations",
			"list_lots",
			"list_projects",
			"list_specifications",
			"list_supplies",
			"list_trades",
			"list_work_items",
		]);
		for (const tool of tools) {
			expect(tool.annotations).toMatchObject({ destructiveHint: false, readOnlyHint: true });
			expect(tool.outputSchema).toBeDefined();
		}
	});

	it("reads the library with its filters", async () => {
		const { api, calls } = fakeApi({
			"/v1/library/supplies": page([supply]),
			"/v1/library/trades": page([trade]),
			"/v1/library/work-items": page([workItem]),
			[`/v1/library/groups/${GROUP_ID}`]: { data: group },
		});
		const client = await connect(api);

		const trades = await client.callTool({ arguments: {}, name: "list_trades" });
		const items = await client.callTool({
			arguments: { group_id: GROUP_ID, search: "lavabo" },
			name: "list_work_items",
		});
		const supplies = await client.callTool({
			arguments: { archived: true },
			name: "list_supplies",
		});
		const groupResult = await client.callTool({
			arguments: { group_id: GROUP_ID },
			name: "get_library_group",
		});

		for (const result of [trades, items, supplies, groupResult]) {
			expect(result.isError).toBeFalsy();
		}
		expect(items.structuredContent).toMatchObject({ work_items: [workItem] });
		expect(groupResult.structuredContent).toEqual(group);
		expect(calls).toContainEqual({
			path: "/v1/library/work-items",
			query: {
				archived: undefined,
				group_id: GROUP_ID,
				page: undefined,
				per_page: undefined,
				search: "lavabo",
				trade_id: undefined,
			},
		});
		expect(calls).toContainEqual({
			path: "/v1/library/supplies",
			query: { archived: true, page: undefined, per_page: undefined, search: undefined },
		});
	});

	it("pages projects and answers in structured content and in text", async () => {
		const { api, calls } = fakeApi({ "/v1/projects": page([project]) });
		const client = await connect(api);

		const result = await client.callTool({
			arguments: { page: 2, per_page: 5 },
			name: "list_projects",
		});

		expect(result.isError).toBeFalsy();
		expect(calls).toEqual([{ path: "/v1/projects", query: { page: 2, per_page: 5 } }]);
		expect(result.structuredContent).toEqual({
			pagination: page([project]).pagination,
			projects: [project],
		});
		expect(JSON.parse(text(result))).toEqual(result.structuredContent);
	});

	it("reads a lot with its lines and a project's totals", async () => {
		const { api } = fakeApi({
			[`/v1/projects/${PROJECT_ID}/lots/${LOT_ID}`]: {
				data: { ...lot, specifications: [specification] },
			},
			[`/v1/projects/${PROJECT_ID}/totals`]: { data: totals },
		});
		const client = await connect(api);

		const lotResult = await client.callTool({
			arguments: { lot_id: LOT_ID, project_id: PROJECT_ID },
			name: "get_lot",
		});
		const totalsResult = await client.callTool({
			arguments: { project_id: PROJECT_ID },
			name: "get_project_totals",
		});

		expect(lotResult.structuredContent).toMatchObject({ specifications: [specification] });
		expect(totalsResult.structuredContent).toEqual(totals);
	});

	it("lets a field the API adds later go through", async () => {
		const { api } = fakeApi({
			[`/v1/projects/${PROJECT_ID}/locations`]: { data: [{ ...location, level_code: "R+1" }] },
		});
		const client = await connect(api);

		const result = await client.callTool({
			arguments: { project_id: PROJECT_ID },
			name: "list_locations",
		});

		expect(result.isError).toBeFalsy();
		expect(result.structuredContent).toEqual({ locations: [{ ...location, level_code: "R+1" }] });
	});

	it("turns an API refusal into a tool error the assistant can act on", async () => {
		const refusal = new RaygisterApiError(
			"The organization's access to the Raygister project manager space has ended.",
			"moe_access_ended",
			403
		);
		const client = await connect(fakeApi({ "/v1/projects": refusal }).api);

		const result = await client.callTool({ arguments: {}, name: "list_projects" });

		expect(result.isError).toBe(true);
		expect(text(result)).toContain("access to the Raygister project manager space has ended");
	});

	it("refuses an id that is not one before calling the API", async () => {
		const { api, calls } = fakeApi({});
		const client = await connect(api);

		const result = await client.callTool({
			arguments: { project_id: "Appartement Martin" },
			name: "get_project",
		});

		expect(result.isError).toBe(true);
		expect(calls).toEqual([]);
	});

	it("fails loudly when the API drifts from the declared shape", async () => {
		const { api } = fakeApi({
			[`/v1/projects/${PROJECT_ID}`]: { data: { ...project, name: null } },
		});
		const client = await connect(api);

		const result = await client.callTool({
			arguments: { project_id: PROJECT_ID },
			name: "get_project",
		});

		expect(result.isError).toBe(true);
		expect(text(result)).toContain("Output validation error");
	});
});
