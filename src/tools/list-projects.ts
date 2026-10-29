import { z } from "zod";
import { getPage } from "../client.js";
import { PageInput, PaginationSchema, PerPageInput, ProjectSchema } from "../schemas.js";
import { defineTool } from "./define.js";

export const listProjectsTool = defineTool({
	name: "list_projects",
	title: "List projects",
	description:
		"List the projects of the organization the API key belongs to, sorted by name, 20 per page by default (up to 100). Each project has its id, display_id, name, phase, client, address, dates, forecast budget (HT) and fee settings. Use the id with the other tools.",
	inputSchema: z.object({ page: PageInput, per_page: PerPageInput }),
	outputSchema: z.object({ pagination: PaginationSchema, projects: z.array(ProjectSchema) }),
	async run(args, { client }) {
		const { data, pagination } = await getPage(client, "/v1/projects", {
			page: args.page,
			per_page: args.per_page,
		});
		return { pagination, projects: data };
	},
});
