import { z } from "zod";
import type { ToolDefinition } from "./types.js";

const inputSchema = {
	projectId: z
		.string()
		.uuid("projectId must be a valid UUID")
		.describe("UUID of the parent project"),
	lotId: z
		.string()
		.uuid("lotId must be a valid UUID")
		.describe("UUID of the lot"),
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

export const listSpecificationsTool: ToolDefinition<typeof inputSchema> = {
	name: "list_specifications",
	description:
		"List all specifications of a given lot. Specifications are the detailed line items of the DPGF (project bid document). Returns IDs, descriptions, quantities, units, and tags.",
	inputSchema,
	async handler(args, { client }) {
		const projectId = encodeURIComponent(args.projectId);
		const lotId = encodeURIComponent(args.lotId);
		return await client.get(`/v1/projects/${projectId}/lots/${lotId}/specifications`, {
			page: args.page,
			per_page: args.per_page,
		});
	},
};
