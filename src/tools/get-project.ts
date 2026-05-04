import { z } from "zod";
import type { ToolDefinition } from "./types.js";

const inputSchema = {
	projectId: z
		.string()
		.uuid("projectId must be a valid UUID")
		.describe("UUID of the Raygister project"),
};

export const getProjectTool: ToolDefinition<typeof inputSchema> = {
	name: "get_project",
	description:
		"Retrieve full details of a single Raygister project by ID, including counts of lots, locations, and specifications, plus organization context. Use list_projects first if the project ID is unknown.",
	inputSchema,
	async handler(args, { client }) {
		return await client.get(`/v1/projects/${encodeURIComponent(args.projectId)}`);
	},
};
