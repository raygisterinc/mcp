/** Bodies shaped like the Raygister API v1 answers. */

export const PROJECT_ID = "aaa00001-0001-4000-8000-000000000001";
export const LOT_ID = "eee00001-0001-4000-8000-000000000001";

export const project = {
	address: "12 rue des Lilas, Lyon",
	budget_previsionnel: 120000,
	client_name: "M. et Mme Martin",
	consultant_fee: 8,
	consultant_fee_type: "percentage",
	cover_image_url: null,
	created_at: "2026-10-29T15:30:58.444415+00:00",
	currency: "EUR",
	default_management_fee: 5,
	default_management_fee_type: "percentage",
	description: null,
	destination: "residential",
	display_id: "aaa00001",
	end_date: null,
	finish_level: null,
	id: PROJECT_ID,
	name: "Appartement Martin",
	notes: null,
	phase: "consultation",
	phase_step: null,
	start_date: "2026-11-02",
	typology: null,
	updated_at: "2026-10-29T15:30:58.444415+00:00",
};

export const lot = {
	architect_fees_excluded: false,
	budget_previsionnel: null,
	consultant_management_fee: null,
	consultation_deadline: null,
	contractors_count: 2,
	created_at: "2026-10-29T15:30:58.444415+00:00",
	custom_name: null,
	deadline: null,
	default_tax_rate_id: null,
	description: null,
	fee_type: "percentage",
	id: LOT_ID,
	instance_number: null,
	lot_type: { id: "type-demo", is_raygister: true, name: "Démolition", prefix: "DEMO" },
	management_fees_excluded: false,
	name: "Démolition",
	notes: null,
	project_id: PROJECT_ID,
	sort_order: 1,
	spec_budget_total: 4795,
	specifications_count: 1,
	start_date: null,
	status: "draft",
	updated_at: "2026-10-29T15:30:58.444415+00:00",
};

export const specification = {
	architect_fees_excluded: false,
	created_at: "2026-10-29T15:30:58.444415+00:00",
	currency: "EUR",
	custom_unit: null,
	deadline: null,
	description: null,
	display_id: "DEMO-001",
	id: "fff00101-0001-4000-8000-000000000001",
	internal_notes: null,
	is_visible_to_contractors: true,
	lot_id: LOT_ID,
	management_fees_excluded: false,
	name: "Dépose revêtements de sol",
	norms: null,
	quantity: 145,
	sort_order: 1,
	start_date: null,
	status: "draft",
	tax_rate: { id: "rate-20", name: "TVA 20%", rate: 20 },
	unit: "m2",
	unit_price: 18,
	updated_at: "2026-10-29T15:30:58.444415+00:00",
};

export const location = {
	color: "#3B82F6",
	created_at: "2026-10-29T15:30:58.444415+00:00",
	description: null,
	floor: null,
	id: "ddd00001-0001-4000-8000-000000000001",
	name: "Pièces de vie",
	parent_id: null,
	sort_order: 1,
	state: null,
	surface: 55,
	updated_at: "2026-10-29T15:30:58.444415+00:00",
};

const vat = { amount: 522, base_ht: 2610, name: "TVA 20%", rate: 20 };

export const totals = {
	currency: "EUR",
	fees: {
		architect_fees_ht: 208.8,
		management_fees_ht: 130.5,
		total_ht: 339.3,
		total_ttc: 407.16,
		vat: { amount: 67.86, base_ht: 339.3, name: "TVA 20%", rate: 20 },
	},
	lots: [
		{
			display_prefix: "DEMO",
			id: LOT_ID,
			management_fees_ht: 130.5,
			name: "Démolition",
			specifications_count: 1,
			unpriced_specifications_count: 0,
			works_ht: 2610,
			works_ttc: 3132,
		},
	],
	specifications_count: 1,
	unpriced_specifications_count: 0,
	works: { total_ht: 2610, total_ttc: 3132, total_vat: 522, vat: [vat] },
};

export const GROUP_ID = "ccc00001-0001-4000-8000-000000000001";

const STAMP = "2026-11-16T15:30:58.444415+00:00";
const tradeRef = { id: "type-plom", name: "Plomberie", prefix: "PLOM" };

export const trade = {
	...tradeRef,
	created_at: STAMP,
	description: null,
	guidelines: "Décrire les réseaux d'alimentation et d'évacuation.",
	icon: null,
	is_hidden: false,
	is_raygister: true,
	updated_at: STAMP,
	vocabulary: ["sanitaire", "évacuation"],
};

export const group = {
	archived_at: null,
	budget_previsionnel: null,
	consultant_management_fee: null,
	created_at: STAMP,
	custom_name: "Salle de bain",
	default_tax_rate_id: null,
	description: null,
	fee_type: null,
	id: GROUP_ID,
	name: "Salle de bain",
	notes: null,
	reference: "BPU-SDB",
	sort_order: 0,
	trade: tradeRef,
	updated_at: STAMP,
};

export const supply = {
	archived_at: null,
	brand: "Grohe",
	category: "Robinetterie",
	created_at: STAMP,
	custom_unit: null,
	description: null,
	id: "bbb00001-0001-4000-8000-000000000001",
	image_url: null,
	name: "Mitigeur lavabo",
	product_url: null,
	public_price: 189,
	reference: "GRO-23",
	supplier: null,
	tax_rate: { id: "rate-20", name: "TVA 20%", rate: 20 },
	unit: "u",
	updated_at: STAMP,
};

export const workItem = {
	archived_at: null,
	created_at: STAMP,
	currency: "EUR",
	custom_unit: null,
	description: "Fourniture et pose d'un lavabo",
	group_id: GROUP_ID,
	id: "bbb00002-0001-4000-8000-000000000001",
	name: "Pose lavabo",
	norms: null,
	quantity: 1,
	reference: "PL-01",
	sort_order: 0,
	supplies: [{ brand: "Grohe", id: supply.id, name: supply.name, reference: "GRO-23" }],
	tax_rate: { id: "rate-10", name: "TVA 10%", rate: 10 },
	trade_id: tradeRef.id,
	unit: "u",
	unit_price: 250,
	updated_at: STAMP,
};

export function page<T>(data: T[]) {
	return { data, pagination: { page: 1, per_page: 20, total: data.length, total_pages: 1 } };
}
