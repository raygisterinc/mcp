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
	body?: unknown;
	method?: string;
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
		send(method, path, body) {
			calls.push({ body, method, path });
			const answer = answers[`${method} ${path}`];
			if (answer === undefined) {
				return Promise.reject(new RaygisterApiError("Not found.", "not_found", 404));
			}
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
	it("read everything and write the library, each with an output schema", async () => {
		const client = await connect(fakeApi({}).api);

		const { tools } = await client.listTools();

		const reads = [
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
		];
		const writes = [
			"archive_library_groups",
			"archive_supplies",
			"archive_work_items",
			"create_library_groups",
			"create_supplies",
			"create_trades",
			"create_work_items",
			"link_work_item_supply",
			"move_work_items",
			"set_trade_guidance",
			"unlink_work_item_supply",
			"update_library_groups",
			"update_supplies",
			"update_trades",
			"update_work_items",
		];
		expect(tools.map((tool) => tool.name).sort()).toEqual([...reads, ...writes].sort());
		for (const tool of tools) {
			expect(tool.annotations?.readOnlyHint).toBe(reads.includes(tool.name));
			expect(tool.outputSchema).toBeDefined();
		}
		const create = tools.find((tool) => tool.name === "create_work_items");
		expect(create?.annotations).toMatchObject({ destructiveHint: false, idempotentHint: false });
	});

	it("writes the library through the API and answers the ids", async () => {
		const { api, calls } = fakeApi({
			"POST /v1/library/work-items": { data: { ids: ["w1", "w2"] } },
			[`PUT /v1/library/trades/${GROUP_ID}/guidance`]: { data: { ids: [GROUP_ID] } },
			[`DELETE /v1/library/work-items/${GROUP_ID}/supplies/${LOT_ID}`]: { data: { ids: [GROUP_ID] } },
		});
		const client = await connect(api);

		const created = await client.callTool({
			arguments: {
				items: [
					{ group_id: GROUP_ID, name: "Pose lavabo", unit: "u", unit_price: 120 },
					{ name: "Dépose", trade_id: GROUP_ID },
				],
			},
			name: "create_work_items",
		});
		const guidance = await client.callTool({
			arguments: { guidelines: "Price per m2", trade_id: GROUP_ID },
			name: "set_trade_guidance",
		});
		const unlinked = await client.callTool({
			arguments: { supply_id: LOT_ID, work_item_id: GROUP_ID },
			name: "unlink_work_item_supply",
		});

		expect(created.structuredContent).toEqual({ ids: ["w1", "w2"] });
		expect(guidance.isError).toBeFalsy();
		expect(unlinked.isError).toBeFalsy();
		expect(calls).toContainEqual({
			body: {
				items: [
					{ group_id: GROUP_ID, name: "Pose lavabo", unit: "u", unit_price: 120 },
					{ name: "Dépose", trade_id: GROUP_ID },
				],
			},
			method: "POST",
			path: "/v1/library/work-items",
		});
		expect(calls).toContainEqual({
			body: { guidelines: "Price per m2" },
			method: "PUT",
			path: `/v1/library/trades/${GROUP_ID}/guidance`,
		});
	});

	it("refuses a batch over 100 before calling the API", async () => {
		const { api, calls } = fakeApi({});
		const client = await connect(api);

		const result = await client.callTool({
			arguments: { items: Array.from({ length: 101 }, () => ({ name: "x" })) },
			name: "create_supplies",
		});

		expect(result.isError).toBe(true);
		expect(calls).toEqual([]);
	});

	it("passes a role refusal on to the assistant", async () => {
		const { api } = fakeApi({
			"POST /v1/library/trades": new RaygisterApiError(
				"Refused: This write needs the admin role; the caller is member.",
				"forbidden",
				403
			),
		});
		const client = await connect(api);

		const result = await client.callTool({
			arguments: { items: [{ name: "Cuisine", prefix: "CUIS" }] },
			name: "create_trades",
		});

		expect(result.isError).toBe(true);
		expect(text(result)).toContain("needs the admin role");
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
