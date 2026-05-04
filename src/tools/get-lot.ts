import { z } from "zod";
import type { ToolDefinition } from "./types.js";

const inputSchema = {
	projectId: z
		.string()
		.uuid("projectId must be a valid UUID")
		.describe("UUID of the parent project"),
	lotId: z.string().uuid("lotId must be a valid UUID").describe("UUID of the lot"),
};

export const getLotTool: ToolDefinition<typeof inputSchema> = {
	name: "get_lot",
	description:
		"Retrieve a single lot with its full description, type, instance number, current status, and inline specifications. Use list_lots first if the lot ID is unknown.",
	inputSchema,
	async handler(args, { client }) {
		const projectId = encodeURIComponent(args.projectId);
		const lotId = encodeURIComponent(args.lotId);
		return await client.get(`/v1/projects/${projectId}/lots/${lotId}`);
	},
};
