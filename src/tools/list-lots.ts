import { z } from "zod";
import { getPage } from "../client.js";
import { IdInput, LotSchema, PageInput, PaginationSchema, PerPageInput } from "../schemas.js";
import { defineTool, segment } from "./define.js";

export const listLotsTool = defineTool({
	name: "list_lots",
	title: "List a project's lots",
	description:
		"List the lots of a project (one per trade, such as electricity or plumbing), in the order of the app's grid, 20 per page by default (up to 100). Each lot has its name, its type (name, prefix such as ELEC, and whether Raygister provides it), its status (draft, consulting, processing, validated), its number of specifications, spec_budget_total (sum of its lines, HT), its forecast budget and consultation deadline.",
	inputSchema: z.object({
		page: PageInput,
		per_page: PerPageInput,
		project_id: IdInput.describe("Project id, from list_projects."),
	}),
	outputSchema: z.object({ lots: z.array(LotSchema), pagination: PaginationSchema }),
	async run(args, { client }) {
		const { data, pagination } = await getPage(
			client,
			`/v1/projects/${segment(args.project_id)}/lots`,
			{ page: args.page, per_page: args.per_page }
		);
		return { lots: data, pagination };
	},
});
