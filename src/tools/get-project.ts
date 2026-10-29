import { z } from "zod";
import { getData } from "../client.js";
import { IdInput, ProjectSchema } from "../schemas.js";
import { defineTool, segment } from "./define.js";

export const getProjectTool = defineTool({
	name: "get_project",
	title: "Get a project",
	description:
		"Get one project by id: name, display_id, phase and phase step, typology, destination, finish level, client, address, dates, forecast budget (HT), project manager (MOE) fees, default management fees and notes. For its amounts, use get_project_totals.",
	inputSchema: z.object({ project_id: IdInput.describe("Project id, from list_projects.") }),
	outputSchema: ProjectSchema,
	async run(args, { client }) {
		return (await getData(client, `/v1/projects/${segment(args.project_id)}`)) as Record<
			string,
			unknown
		>;
	},
});
