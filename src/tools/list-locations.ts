import { z } from "zod";
import type { ToolDefinition } from "./types.js";

const inputSchema = {
	projectId: z
		.string()
		.uuid("projectId must be a valid UUID")
		.describe("UUID of the parent project"),
};

export const listLocationsTool: ToolDefinition<typeof inputSchema> = {
	name: "list_locations",
	description:
		"List all locations (rooms, floors, zones) of a project. Returns location IDs, names, floor numbers, and parent location IDs for hierarchy. The response is a flat list, not paginated.",
	inputSchema,
	async handler(args, { client }) {
		return await client.get(`/v1/projects/${encodeURIComponent(args.projectId)}/locations`);
	},
};
