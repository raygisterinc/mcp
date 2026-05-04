import { z } from "zod";
import type { ToolDefinition } from "./types.js";

const inputSchema = {
	projectId: z
		.string()
		.uuid("projectId must be a valid UUID")
		.describe("UUID of the parent project"),
	page: z
		.number()
		.int()
		.min(1)
		.optional()
		.describe("Page number, 1-indexed. Defaults to 1."),
	per_page: z
		.number()
		.int()
		.min(1)
		.max(100)
		.optional()
		.describe("Items per page, max 100. Defaults to 20."),
};

export const listLotsTool: ToolDefinition<typeof inputSchema> = {
	name: "list_lots",
	description:
		"List all lots (work packages) of a given project. Returns lot IDs, types (e.g. plumbing, HVAC), names, and statuses. Use the lot IDs to fetch specifications or full lot details.",
	inputSchema,
	async handler(args, { client }) {
		return await client.get(`/v1/projects/${encodeURIComponent(args.projectId)}/lots`, {
			page: args.page,
			per_page: args.per_page,
		});
	},
};
