import { z } from "zod";
import { getData } from "../client.js";
import { IdInput, ProjectTotalsSchema } from "../schemas.js";
import { defineTool, segment } from "./define.js";

export const getProjectTotalsTool = defineTool({
	name: "get_project_totals",
	title: "Get a project's amounts",
	description:
		"Get a project's amounts as the DPGF estimate prints them: works HT, VAT per rate and TTC, for the whole project and per lot, with the project manager (MOE) fees and the management fees reported apart (they are never added to the works). Also counts the lines not priced yet. Use it rather than adding up specifications.",
	inputSchema: z.object({ project_id: IdInput.describe("Project id, from list_projects.") }),
	outputSchema: ProjectTotalsSchema,
	async run(args, { client }) {
		return (await getData(client, `/v1/projects/${segment(args.project_id)}/totals`)) as Record<
			string,
			unknown
		>;
	},
});
