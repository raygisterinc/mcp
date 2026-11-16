import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RaygisterClient } from "./client.js";
import { tools } from "./tools/index.js";
import { VERSION } from "./version.js";

const INSTRUCTIONS = `Raygister holds construction projects described by a project manager (maître d'œuvre, MOE).
A project has lots, one per trade (ELEC for electricity, PLOM for plumbing...), and each lot has specifications: the lines of the DPGF (bill of quantities), each with a quantity, a unit and a unit price. Locations are the project's rooms and zones.
Amounts are excluding VAT (HT) in the project's currency unless a field says ttc or vat. A unit_price of null means the line is not priced yet; 0 is a price.
Start with list_projects to find ids. For amounts, call get_project_totals instead of adding lines up. To read a whole lot, get_lot returns it with all its lines.
The library (Bibliothèque) is what the organization reuses from one project to the next: its trades (list_trades, the lot types with their prefix and the guidance the assistant follows), its library groups (list_library_groups: a trade and a name, which a project's lot is created from), its work items (list_work_items: reusable lines with a reference price and the supplies they prescribe, filed in a group or under a trade) and its supplies (list_supplies: the products it prescribes). Every organization has one, a company's as well as a project manager's, and reads it even when its project manager space is closed.
Every tool is read-only and sees only the organization the API key belongs to.`;

export function createServer(client: RaygisterClient): McpServer {
	const server = new McpServer(
		{ name: "raygister-mcp", title: "Raygister", version: VERSION },
		{ instructions: INSTRUCTIONS }
	);
	for (const tool of tools) {
		tool.register(server, { client });
	}
	return server;
}
