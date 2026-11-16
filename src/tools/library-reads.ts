import { z } from "zod";
import { getData, getPage } from "../client.js";
import {
	ArchivedInput,
	IdInput,
	LibraryGroupSchema,
	PageInput,
	PaginationSchema,
	PerPageInput,
	SearchInput,
	SupplySchema,
	TradeSchema,
	WorkItemSchema,
} from "../schemas.js";
import { defineTool, segment } from "./define.js";

/**
 * The library (Bibliothèque): the organization's trades, library groups,
 * work items and supplies. It belongs to the organization, project manager
 * or company alike, and stays readable when the project manager space is
 * closed to it.
 */

export const listTradesTool = defineTool({
	name: "list_trades",
	title: "List the library's trades",
	description:
		"List the organization's trades (lot types such as Plomberie, PLOM), hidden ones included, sorted by name, 20 per page by default (up to 100). Each trade has its prefix, icon, whether Raygister provides it, and the guidance the assistant follows: description, vocabulary and AI guidelines (null when the Raygister default applies).",
	inputSchema: z.object({ page: PageInput, per_page: PerPageInput }),
	outputSchema: z.object({ pagination: PaginationSchema, trades: z.array(TradeSchema) }),
	async run(args, { client }) {
		const { data, pagination } = await getPage(client, "/v1/library/trades", {
			page: args.page,
			per_page: args.per_page,
		});
		return { pagination, trades: data };
	},
});

export const getTradeTool = defineTool({
	name: "get_trade",
	title: "Get a trade",
	description: "Get one trade of the organization's library with its guidance.",
	inputSchema: z.object({ trade_id: IdInput.describe("Trade id, from list_trades.") }),
	outputSchema: TradeSchema,
	async run(args, { client }) {
		return (await getData(client, `/v1/library/trades/${segment(args.trade_id)}`)) as Record<
			string,
			unknown
		>;
	},
});

export const listLibraryGroupsTool = defineTool({
	name: "list_library_groups",
	title: "List the library's groups",
	description:
		"List the organization's library groups (lots de la bibliothèque: a trade and a name that work items are filed in, and that a project's lot is created from), in the library's order, 20 per page by default (up to 100). Active ones unless archived is true.",
	inputSchema: z.object({ archived: ArchivedInput, page: PageInput, per_page: PerPageInput }),
	outputSchema: z.object({ groups: z.array(LibraryGroupSchema), pagination: PaginationSchema }),
	async run(args, { client }) {
		const { data, pagination } = await getPage(client, "/v1/library/groups", {
			archived: args.archived,
			page: args.page,
			per_page: args.per_page,
		});
		return { groups: data, pagination };
	},
});

export const getLibraryGroupTool = defineTool({
	name: "get_library_group",
	title: "Get a library group",
	description:
		"Get one library group. To read its work items, call list_work_items with its id as group_id.",
	inputSchema: z.object({ group_id: IdInput.describe("Group id, from list_library_groups.") }),
	outputSchema: LibraryGroupSchema,
	async run(args, { client }) {
		return (await getData(client, `/v1/library/groups/${segment(args.group_id)}`)) as Record<
			string,
			unknown
		>;
	},
});

export const listWorkItemsTool = defineTool({
	name: "list_work_items",
	title: "List the library's work items",
	description:
		"List the organization's work items (prestations: reusable lines with a designation, description, unit, quantity, reference price HT, VAT rate, norms and the supplies they prescribe), sorted by name, 20 per page by default (up to 100). Filter by group, by trade, by text (designation, reference, description), and archived ones with archived true.",
	inputSchema: z.object({
		archived: ArchivedInput,
		group_id: IdInput.optional().describe("Only the work items of this library group."),
		page: PageInput,
		per_page: PerPageInput,
		search: SearchInput,
		trade_id: IdInput.optional().describe("Only the work items of this trade."),
	}),
	outputSchema: z.object({ pagination: PaginationSchema, work_items: z.array(WorkItemSchema) }),
	async run(args, { client }) {
		const { data, pagination } = await getPage(client, "/v1/library/work-items", {
			archived: args.archived,
			group_id: args.group_id,
			page: args.page,
			per_page: args.per_page,
			search: args.search,
			trade_id: args.trade_id,
		});
		return { pagination, work_items: data };
	},
});

export const getWorkItemTool = defineTool({
	name: "get_work_item",
	title: "Get a work item",
	description: "Get one work item of the library with its VAT rate and its supplies.",
	inputSchema: z.object({ work_item_id: IdInput.describe("Work item id, from list_work_items.") }),
	outputSchema: WorkItemSchema,
	async run(args, { client }) {
		return (await getData(client, `/v1/library/work-items/${segment(args.work_item_id)}`)) as Record<
			string,
			unknown
		>;
	},
});

export const listSuppliesTool = defineTool({
	name: "list_supplies",
	title: "List the library's supplies",
	description:
		"List the organization's supplies (fournitures: products it prescribes, with brand, reference, supplier, category, unit and public price HT), sorted by name, 20 per page by default (up to 100). Filter by text (name, brand, reference, supplier, category), and archived ones with archived true.",
	inputSchema: z.object({
		archived: ArchivedInput,
		page: PageInput,
		per_page: PerPageInput,
		search: SearchInput,
	}),
	outputSchema: z.object({ pagination: PaginationSchema, supplies: z.array(SupplySchema) }),
	async run(args, { client }) {
		const { data, pagination } = await getPage(client, "/v1/library/supplies", {
			archived: args.archived,
			page: args.page,
			per_page: args.per_page,
			search: args.search,
		});
		return { pagination, supplies: data };
	},
});

export const getSupplyTool = defineTool({
	name: "get_supply",
	title: "Get a supply",
	description: "Get one supply of the library.",
	inputSchema: z.object({ supply_id: IdInput.describe("Supply id, from list_supplies.") }),
	outputSchema: SupplySchema,
	async run(args, { client }) {
		return (await getData(client, `/v1/library/supplies/${segment(args.supply_id)}`)) as Record<
			string,
			unknown
		>;
	},
});
