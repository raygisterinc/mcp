import { z } from "zod";
import { getData } from "../client.js";
import { IdInput, LotSchema, SpecificationSchema } from "../schemas.js";
import { defineTool, segment } from "./define.js";

export const getLotTool = defineTool({
	name: "get_lot",
	title: "Get a lot with its lines",
	description:
		"Get one lot with all its specifications (up to 1000) in a single call. Prefer it to list_specifications to read a whole lot.",
	inputSchema: z.object({
		lot_id: IdInput.describe("Lot id, from list_lots."),
		project_id: IdInput.describe("Id of the lot's project."),
	}),
	outputSchema: LotSchema.extend({ specifications: z.array(SpecificationSchema) }),
	async run(args, { client }) {
		return (await getData(
			client,
			`/v1/projects/${segment(args.project_id)}/lots/${segment(args.lot_id)}`
		)) as Record<string, unknown>;
	},
});
