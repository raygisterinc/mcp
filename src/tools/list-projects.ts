import { z } from "zod";
import type { ToolDefinition } from "./types.js";

const inputSchema = {
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

export const listProjectsTool: ToolDefinition<typeof inputSchema> = {
	name: "list_projects",
	description:
		"List all projects in the user's Raygister organization. Supports pagination via page and per_page. Returns project IDs, names, statuses, and creation dates. Use the project ID to fetch lots, locations, or full project details.",
	inputSchema,
	async handler(args, { client }) {
		return await client.get("/v1/projects", {
			page: args.page,
			per_page: args.per_page,
		});
	},
};
