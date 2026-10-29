import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RaygisterClient } from "./client.js";
import { tools } from "./tools/index.js";
import { VERSION } from "./version.js";

const INSTRUCTIONS = `Raygister holds construction projects described by a project manager (maître d'œuvre, MOE).
A project has lots, one per trade (ELEC for electricity, PLOM for plumbing...), and each lot has specifications: the lines of the DPGF (bill of quantities), each with a quantity, a unit and a unit price. Locations are the project's rooms and zones.
Amounts are excluding VAT (HT) in the project's currency unless a field says ttc or vat. A unit_price of null means the line is not priced yet; 0 is a price.
Start with list_projects to find ids. For amounts, call get_project_totals instead of adding lines up. To read a whole lot, get_lot returns it with all its lines.
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
