import { z } from "zod";
import { sendWrite } from "../client.js";
import { IdInput } from "../schemas.js";
import { defineTool, segment } from "./define.js";

/**
 * Library writes (RAY-1154): one tool per API operation. The key acts as the
 * member who created it, with their role: admins write trades; admins and
 * members write groups, work items and supplies; a viewer's key is refused.
 * A create or an update takes up to 100 items and lands whole or not at all.
 * Every write answers the ids it wrote, in the order of its input.
 */

const BATCH_MAX = 100;
const Ids = z.object({ ids: z.array(z.string()) });

const Text = z.string().nullable().optional();
const Price = z.number().nullable().optional();
const Unit = z
	.string()
	.nullable()
	.optional()
	.describe("A unit code (u, m, m2, m3, ml, kg, h, j, ens, ff...), or autre with custom_unit.");

function batch<T extends z.ZodType>(item: T, what: string) {
	return z.object({
		items: z
			.array(item)
			.min(1)
			.max(BATCH_MAX)
			.describe(`Up to ${BATCH_MAX} ${what}, written all together or not at all.`),
	});
}

const ArchiveInput = z.object({
	archived: z.boolean().describe("true archives (out of the pickers), false restores."),
	ids: z.array(IdInput).min(1).max(BATCH_MAX),
});

// --- Trades -------------------------------------------------------------------

const Guidance = {
	description: Text.describe("What the trade covers; null follows the Raygister default."),
	guidelines: Text.describe("AI guidelines: how to describe, split and price the trade's works."),
	vocabulary: z
		.array(z.string())
		.nullable()
		.optional()
		.describe("Words that recognise the trade in a quote or a brief; null follows the default."),
};

export const createTradesTool = defineTool({
	effect: "create",
	name: "create_trades",
	title: "Create trades",
	description:
		"Create trades (lot types) of the organization's own, with a unique name and a unique prefix of 2 to 6 capital letters or digits, and optionally an icon and their guidance. Admins only.",
	inputSchema: batch(
		z.object({
			icon: z.string().nullable().optional().describe("A Lucide icon name of Raygister's set."),
			name: z.string(),
			prefix: z.string(),
			...Guidance,
		}),
		"trades"
	),
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(client, "POST", "/v1/library/trades", args);
	},
});

export const updateTradesTool = defineTool({
	effect: "update",
	name: "update_trades",
	title: "Update trades",
	description:
		"Rename trades, change their prefix (not a Raygister trade's, nor one a lot carries) or icon, hide or show them (the organization keeps one visible). Admins only.",
	inputSchema: batch(
		z.object({
			icon: z.string().nullable().optional(),
			id: IdInput.describe("Trade id, from list_trades."),
			is_hidden: z.boolean().optional(),
			name: z.string().optional(),
			prefix: z.string().optional(),
		}),
		"trades"
	),
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(client, "PATCH", "/v1/library/trades", args);
	},
});

export const setTradeGuidanceTool = defineTool({
	effect: "update",
	name: "set_trade_guidance",
	title: "Set a trade's guidance",
	description:
		"Set a trade's description, vocabulary and AI guidelines. A field left out keeps its value; null follows the Raygister default. Admins only.",
	inputSchema: z.object({ trade_id: IdInput.describe("Trade id, from list_trades."), ...Guidance }),
	outputSchema: Ids,
	async run({ trade_id, ...body }, { client }) {
		return await sendWrite(client, "PUT", `/v1/library/trades/${segment(trade_id)}/guidance`, body);
	},
});

// --- Groups -------------------------------------------------------------------

const GroupFields = {
	budget_previsionnel: Price,
	consultant_management_fee: Price.describe(
		"The fee. On a create it is a percentage unless fee_type is fixed; on an update the type left out keeps its value."
	),
	custom_name: Text.describe("The group's name; null takes its trade's."),
	default_tax_rate_id: IdInput.nullable().optional().describe("Default VAT of its new work items."),
	description: Text,
	fee_type: z.enum(["percentage", "fixed"]).optional(),
	notes: Text,
	reference: Text,
};

export const createLibraryGroupsTool = defineTool({
	effect: "create",
	name: "create_library_groups",
	title: "Create library groups",
	description:
		"Create library groups (lots de la bibliothèque) under a trade, at the end of the library. Work items are then filed in them.",
	inputSchema: batch(
		z.object({ trade_id: IdInput.describe("Trade id, from list_trades."), ...GroupFields }),
		"groups"
	),
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(client, "POST", "/v1/library/groups", args);
	},
});

export const updateLibraryGroupsTool = defineTool({
	effect: "update",
	name: "update_library_groups",
	title: "Update library groups",
	description:
		"Update library groups: only the fields given change. Changing a group's trade changes its work items' with it.",
	inputSchema: batch(
		z.object({
			id: IdInput.describe("Group id, from list_library_groups."),
			trade_id: IdInput.optional(),
			...GroupFields,
		}),
		"groups"
	),
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(client, "PATCH", "/v1/library/groups", args);
	},
});

export const archiveLibraryGroupsTool = defineTool({
	effect: "update",
	name: "archive_library_groups",
	title: "Archive or restore library groups",
	description: "Archive library groups (out of the pickers, kept in the library) or restore them.",
	inputSchema: ArchiveInput,
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(client, "POST", "/v1/library/groups/archive", args);
	},
});

// --- Work items ---------------------------------------------------------------

const WorkItemFields = {
	custom_unit: Text.describe(
		"The unit's label when unit is autre. Given alone on an update, it makes the unit autre."
	),
	description: Text,
	norms: z
		.array(z.unknown())
		.optional()
		.describe("Norms (DTU, NF...), as get_work_item shows them."),
	quantity: Price,
	reference: Text,
	tax_rate_id: IdInput.nullable().optional(),
	unit: Unit,
	unit_price: Price.describe("Reference unit price excl. VAT; null when not priced."),
};

export const createWorkItemsTool = defineTool({
	effect: "create",
	name: "create_work_items",
	title: "Create work items",
	description:
		"Create work items (prestations): in a group (group_id: they take its trade and default VAT) or under a trade without a group (trade_id), at the end, in the organization's currency. Load a price list in batches of up to 100.",
	inputSchema: batch(
		z.object({
			group_id: IdInput.nullable().optional().describe("Group id, from list_library_groups."),
			name: z.string(),
			trade_id: IdInput.nullable()
				.optional()
				.describe("Without a group: the trade, from list_trades."),
			...WorkItemFields,
		}),
		"work items"
	),
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(client, "POST", "/v1/library/work-items", args);
	},
});

export const updateWorkItemsTool = defineTool({
	effect: "update",
	name: "update_work_items",
	title: "Update work items",
	description:
		"Update work items. trade_id only for a work item in no group: one in a group follows the group's trade (move it instead).",
	inputSchema: batch(
		z.object({
			id: IdInput.describe("Work item id, from list_work_items."),
			name: z.string().optional(),
			trade_id: IdInput.nullable().optional(),
			...WorkItemFields,
		}),
		"work items"
	),
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(client, "PATCH", "/v1/library/work-items", args);
	},
});

export const archiveWorkItemsTool = defineTool({
	effect: "update",
	name: "archive_work_items",
	title: "Archive or restore work items",
	description: "Archive work items (out of the pickers, kept in the library) or restore them.",
	inputSchema: ArchiveInput,
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(client, "POST", "/v1/library/work-items/archive", args);
	},
});

export const moveWorkItemsTool = defineTool({
	effect: "update",
	name: "move_work_items",
	title: "Move work items",
	description:
		"Move work items to the end of a group, where they take its trade, or out of their group (group_id null) keeping their trade.",
	inputSchema: z.object({
		group_id: IdInput.nullable().describe("Group id, from list_library_groups; null: no group."),
		ids: z.array(IdInput).min(1).max(BATCH_MAX),
	}),
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(client, "POST", "/v1/library/work-items/move", args);
	},
});

export const linkWorkItemSupplyTool = defineTool({
	effect: "update",
	name: "link_work_item_supply",
	title: "Link a supply to a work item",
	description: "Make a work item prescribe a supply of the library, after the ones it already does.",
	inputSchema: z.object({
		supply_id: IdInput.describe("Supply id, from list_supplies."),
		work_item_id: IdInput.describe("Work item id, from list_work_items."),
	}),
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(
			client,
			"POST",
			`/v1/library/work-items/${segment(args.work_item_id)}/supplies`,
			{ supply_id: args.supply_id }
		);
	},
});

export const unlinkWorkItemSupplyTool = defineTool({
	effect: "update",
	name: "unlink_work_item_supply",
	title: "Unlink a supply from a work item",
	description:
		"Take a supply off a work item; the supply stays in the library. An unknown work item is refused.",
	inputSchema: z.object({ supply_id: IdInput, work_item_id: IdInput }),
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(
			client,
			"DELETE",
			`/v1/library/work-items/${segment(args.work_item_id)}/supplies/${segment(args.supply_id)}`
		);
	},
});

// --- Supplies -----------------------------------------------------------------

const SupplyFields = {
	brand: Text,
	category: Text,
	custom_unit: Text,
	description: Text,
	product_url: Text.describe("The product page, http or https."),
	public_price: Price.describe("Public price excl. VAT."),
	reference: Text,
	supplier: Text,
	tax_rate_id: IdInput.nullable().optional(),
	unit: Unit,
};

export const createSuppliesTool = defineTool({
	effect: "create",
	name: "create_supplies",
	title: "Create supplies",
	description: "Create supplies (fournitures): the products the organization prescribes.",
	inputSchema: batch(z.object({ name: z.string(), ...SupplyFields }), "supplies"),
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(client, "POST", "/v1/library/supplies", args);
	},
});

export const updateSuppliesTool = defineTool({
	effect: "update",
	name: "update_supplies",
	title: "Update supplies",
	description:
		"Update supplies: only the fields given change, and a supply appears once per call. Their photos are set in Raygister, not here.",
	inputSchema: batch(
		z.object({
			id: IdInput.describe("Supply id, from list_supplies."),
			name: z.string().optional(),
			...SupplyFields,
		}),
		"supplies"
	),
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(client, "PATCH", "/v1/library/supplies", args);
	},
});

export const archiveSuppliesTool = defineTool({
	effect: "update",
	name: "archive_supplies",
	title: "Archive or restore supplies",
	description: "Archive supplies (out of the pickers, kept in the library) or restore them.",
	inputSchema: ArchiveInput,
	outputSchema: Ids,
	async run(args, { client }) {
		return await sendWrite(client, "POST", "/v1/library/supplies/archive", args);
	},
});
