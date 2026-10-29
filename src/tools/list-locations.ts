import { z } from "zod";
import { getData } from "../client.js";
import { IdInput, LocationSchema } from "../schemas.js";
import { defineTool, segment } from "./define.js";

export const listLocationsTool = defineTool({
	name: "list_locations",
	title: "List a project's locations",
	description:
		"List every location of a project (rooms, floors, zones) in one call, not paginated. parent_id builds the hierarchy; surface is in square metres.",
	inputSchema: z.object({ project_id: IdInput.describe("Project id, from list_projects.") }),
	outputSchema: z.object({ locations: z.array(LocationSchema) }),
	async run(args, { client }) {
		const locations = await getData(client, `/v1/projects/${segment(args.project_id)}/locations`);
		return { locations };
	},
});
