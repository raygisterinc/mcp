import { z } from "zod";

/**
 * What the Raygister public API (`/api/v1`) returns, as the tools declare it
 * in their output schema. The objects are loose: a field the API adds later
 * goes through instead of failing the tool. Enumerations are plain strings for
 * the same reason.
 *
 * Amounts are excluding VAT (HT), in the project's currency, unless the field
 * name says ttc or vat.
 */

/** An id as Postgres stores it (any UUID layout, as the API accepts it). */
export const IdInput = z.guid();

export const PageInput = z
	.number()
	.int()
	.min(1)
	.optional()
	.describe("Page, from 1. Defaults to 1.");

export const PerPageInput = z
	.number()
	.int()
	.min(1)
	.max(100)
	.optional()
	.describe("Items per page, up to 100. Defaults to 20.");

export const PaginationSchema = z.object({
	page: z.number(),
	per_page: z.number(),
	total: z.number().describe("Items across every page."),
	total_pages: z.number(),
});

const FeeType = z.string().describe("percentage or fixed.");

export const ProjectSchema = z.looseObject({
	address: z.string().nullable(),
	budget_previsionnel: z.number().nullable().describe("Forecast budget, HT."),
	client_name: z.string().nullable(),
	consultant_fee: z.number().nullable().describe("Project manager (MOE) fees."),
	consultant_fee_type: FeeType,
	cover_image_url: z.string().nullable(),
	created_at: z.string(),
	currency: z.string(),
	default_management_fee: z.number().nullable(),
	default_management_fee_type: FeeType,
	description: z.string().nullable(),
	destination: z.string().nullable(),
	display_id: z.string().describe("Short reference shown in the app."),
	end_date: z.string().nullable(),
	finish_level: z.string().nullable(),
	id: z.string(),
	name: z.string(),
	notes: z.string().nullable(),
	phase: z.string(),
	phase_step: z.string().nullable(),
	start_date: z.string().nullable(),
	typology: z.string().nullable(),
	updated_at: z.string(),
});

export const LotTypeSchema = z.looseObject({
	id: z.string(),
	is_raygister: z
		.boolean()
		.describe("True for a type Raygister provides, false for one the organization added."),
	name: z.string(),
	prefix: z.string().describe("Trade prefix, such as ELEC."),
});

export const LotSchema = z.looseObject({
	architect_fees_excluded: z.boolean(),
	budget_previsionnel: z.number().nullable().describe("Forecast budget of the lot, HT."),
	consultant_management_fee: z.number().nullable(),
	consultation_deadline: z.string().nullable(),
	contractors_count: z.number().describe("Companies consulted on the lot."),
	created_at: z.string(),
	custom_name: z.string().nullable(),
	deadline: z.string().nullable(),
	default_tax_rate_id: z.string().nullable(),
	description: z.string().nullable(),
	fee_type: FeeType,
	id: z.string(),
	instance_number: z
		.number()
		.nullable()
		.describe("Rank among the project's lots of the same type (ELEC 2), null when alone."),
	lot_type: LotTypeSchema,
	management_fees_excluded: z.boolean(),
	name: z.string().describe("The custom name, else the type's name."),
	notes: z.string().nullable(),
	project_id: z.string(),
	sort_order: z.number(),
	spec_budget_total: z.number().describe("Sum of quantity x unit price of the lot's lines, HT."),
	specifications_count: z.number(),
	start_date: z.string().nullable(),
	status: z.string().describe("draft, consulting, processing or validated."),
	updated_at: z.string(),
});

export const TaxRateSchema = z.looseObject({
	id: z.string(),
	name: z.string(),
	rate: z.number().describe("A percentage: 20 for 20 %."),
});

export const SpecificationSchema = z.looseObject({
	architect_fees_excluded: z.boolean(),
	created_at: z.string(),
	currency: z.string(),
	custom_unit: z.string().nullable().describe("The organization's own unit, when unit is null."),
	deadline: z.string().nullable(),
	description: z.string().nullable(),
	display_id: z.string().describe("Line reference, such as ELEC-004."),
	id: z.string(),
	internal_notes: z.string().nullable(),
	is_visible_to_contractors: z.boolean(),
	lot_id: z.string(),
	management_fees_excluded: z.boolean(),
	name: z.string(),
	norms: z.unknown().describe("Technical standards the line refers to."),
	quantity: z.number().nullable(),
	sort_order: z.number(),
	start_date: z.string().nullable(),
	status: z.string(),
	tax_rate: TaxRateSchema.nullable(),
	unit: z.string().nullable(),
	unit_price: z.number().nullable().describe("HT. Null means not priced yet; 0 is a price."),
	updated_at: z.string(),
});

export const LocationSchema = z.looseObject({
	color: z.string().nullable(),
	created_at: z.string(),
	description: z.string().nullable(),
	floor: z.number().nullable(),
	id: z.string(),
	name: z.string(),
	parent_id: z.string().nullable().describe("The enclosing location, null at the top."),
	sort_order: z.number(),
	state: z.string().nullable(),
	surface: z.number().nullable().describe("In square metres."),
	updated_at: z.string(),
});

const VatLineSchema = z.looseObject({
	amount: z.number(),
	base_ht: z.number(),
	name: z.string(),
	rate: z.number().describe("A percentage: 20 for 20 %."),
});

export const ProjectTotalsSchema = z.looseObject({
	currency: z.string(),
	fees: z
		.looseObject({
			architect_fees_ht: z.number(),
			management_fees_ht: z.number(),
			total_ht: z.number(),
			total_ttc: z
				.number()
				.nullable()
				.describe("Null when the organization has no default VAT rate for fees."),
			vat: VatLineSchema.nullable(),
		})
		.describe("Project manager (MOE) and management fees, never added to the works."),
	lots: z.array(
		z.looseObject({
			display_prefix: z.string().describe("Prefix of the lot's lines, such as ELEC 2."),
			id: z.string(),
			management_fees_ht: z.number(),
			name: z.string(),
			specifications_count: z.number(),
			unpriced_specifications_count: z.number(),
			works_ht: z.number(),
			works_ttc: z.number(),
		})
	),
	specifications_count: z.number(),
	unpriced_specifications_count: z
		.number()
		.describe("Lines with no unit price yet: they weigh nothing in the totals."),
	works: z.looseObject({
		total_ht: z.number(),
		total_ttc: z.number(),
		total_vat: z.number(),
		vat: z.array(VatLineSchema).describe("VAT bucketed per rate."),
	}),
});

/** The library's archived and search filters, shared by its lists. */
export const ArchivedInput = z
	.boolean()
	.optional()
	.describe("True to list the archived items instead of the active ones. Defaults to false.");

export const SearchInput = z
	.string()
	.max(200)
	.optional()
	.describe("Text to look for, matched as plain text whatever its case.");

export const TradeSchema = z.looseObject({
	created_at: z.string(),
	description: z
		.string()
		.nullable()
		.describe("Null: the Raygister description of the trade applies."),
	guidelines: z
		.string()
		.nullable()
		.describe("The AI guidelines the organization wrote for the trade."),
	icon: z.string().nullable().describe("A Lucide icon name, null for the default icon."),
	id: z.string(),
	is_hidden: z.boolean().describe("Hidden from the pickers, kept on the lots that carry it."),
	is_raygister: z
		.boolean()
		.describe("True for a copy of a Raygister trade, false for one the organization added."),
	name: z.string(),
	prefix: z.string().describe("Trade prefix, such as PLOM, used in line references."),
	updated_at: z.string(),
	vocabulary: z
		.array(z.string())
		.nullable()
		.describe("Words that file a line under the trade; null: the Raygister vocabulary applies."),
});

const TradeRefSchema = z.looseObject({ id: z.string(), name: z.string(), prefix: z.string() });

export const LibraryGroupSchema = z.looseObject({
	archived_at: z.string().nullable(),
	budget_previsionnel: z.number().nullable().describe("Forecast budget, HT."),
	consultant_management_fee: z.number().nullable(),
	created_at: z.string(),
	custom_name: z.string().nullable(),
	default_tax_rate_id: z.string().nullable(),
	description: z.string().nullable(),
	fee_type: z.string().nullable(),
	id: z.string(),
	name: z.string().describe("The custom name, else the trade's name."),
	notes: z.string().nullable(),
	reference: z.string().nullable().describe("The organization's own code (price list, ERP)."),
	sort_order: z.number(),
	trade: TradeRefSchema,
	updated_at: z.string(),
});

export const WorkItemSchema = z.looseObject({
	archived_at: z.string().nullable(),
	created_at: z.string(),
	currency: z.string(),
	custom_unit: z.string().nullable().describe("The organization's own unit, when unit is null."),
	description: z.string().nullable(),
	group_id: z.string().nullable().describe("The library group it is filed in, null when in none."),
	id: z.string(),
	name: z.string(),
	norms: z.unknown().describe("Technical standards the work item refers to."),
	quantity: z.number().nullable(),
	reference: z.string().nullable().describe("The organization's own code (price list, ERP)."),
	sort_order: z.number(),
	supplies: z
		.array(
			z.looseObject({
				brand: z.string().nullable(),
				id: z.string(),
				name: z.string(),
				reference: z.string().nullable(),
			})
		)
		.describe("The supplies it prescribes, in order."),
	tax_rate: TaxRateSchema.nullable(),
	trade_id: z.string().nullable().describe("Its trade; a work item in a group follows the group's."),
	unit: z.string().nullable(),
	unit_price: z
		.number()
		.nullable()
		.describe("Reference price HT, in currency. Null means not priced; 0 is a price."),
	updated_at: z.string(),
});

export const SupplySchema = z.looseObject({
	archived_at: z.string().nullable(),
	brand: z.string().nullable(),
	category: z.string().nullable(),
	created_at: z.string(),
	custom_unit: z.string().nullable(),
	description: z.string().nullable(),
	id: z.string(),
	image_url: z.string().nullable(),
	name: z.string(),
	product_url: z.string().nullable(),
	public_price: z.number().nullable().describe("The supplier's public price, HT."),
	reference: z.string().nullable(),
	supplier: z.string().nullable(),
	tax_rate: TaxRateSchema.nullable(),
	unit: z.string().nullable(),
	updated_at: z.string(),
});
