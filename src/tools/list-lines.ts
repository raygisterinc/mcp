import { z } from "zod";
import { getPage } from "../client.js";
import { IdInput, LineSchema, PageInput, PaginationSchema, PerPageInput } from "../schemas.js";
import { defineTool, segment } from "./define.js";

export const listLinesTool = defineTool({
	name: "list_lines",
	title: "List a lot's lines",
	description:
		"List the lines of a lot, the DPGF (bill of quantities), in the order of the app's grid, 20 per page by default (up to 100). Each line has its display_id (such as ELEC-004), name, description, quantity, unit (or custom_unit), unit_price (HT; null means not priced yet, 0 is a price), VAT rate, status, technical norms and internal notes.",
	inputSchema: z.object({
		lot_id: IdInput.describe("Lot id, from list_lots."),
		page: PageInput,
		per_page: PerPageInput,
		project_id: IdInput.describe("Id of the lot's project."),
	}),
	outputSchema: z.object({
		pagination: PaginationSchema,
		lines: z.array(LineSchema),
	}),
	async run(args, { client }) {
		const { data, pagination } = await getPage(
			client,
			`/v1/projects/${segment(args.project_id)}/lots/${segment(args.lot_id)}/lines`,
			{ page: args.page, per_page: args.per_page }
		);
		return { pagination, lines: data };
	},
});
