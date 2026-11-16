import type { Tool } from "./define.js";
import { getLotTool } from "./get-lot.js";
import { getProjectTool } from "./get-project.js";
import { getProjectTotalsTool } from "./get-project-totals.js";
import {
	getLibraryGroupTool,
	getSupplyTool,
	getTradeTool,
	getWorkItemTool,
	listLibraryGroupsTool,
	listSuppliesTool,
	listTradesTool,
	listWorkItemsTool,
} from "./library-reads.js";
import {
	archiveLibraryGroupsTool,
	archiveSuppliesTool,
	archiveWorkItemsTool,
	createLibraryGroupsTool,
	createSuppliesTool,
	createTradesTool,
	createWorkItemsTool,
	linkWorkItemSupplyTool,
	moveWorkItemsTool,
	setTradeGuidanceTool,
	unlinkWorkItemSupplyTool,
	updateLibraryGroupsTool,
	updateSuppliesTool,
	updateTradesTool,
	updateWorkItemsTool,
} from "./library-writes.js";
import { listLocationsTool } from "./list-locations.js";
import { listLotsTool } from "./list-lots.js";
import { listProjectsTool } from "./list-projects.js";
import { listSpecificationsTool } from "./list-specifications.js";

export const tools: Tool[] = [
	listProjectsTool,
	getProjectTool,
	getProjectTotalsTool,
	listLotsTool,
	getLotTool,
	listSpecificationsTool,
	listLocationsTool,
	listTradesTool,
	getTradeTool,
	listLibraryGroupsTool,
	getLibraryGroupTool,
	listWorkItemsTool,
	getWorkItemTool,
	listSuppliesTool,
	getSupplyTool,
	createTradesTool,
	updateTradesTool,
	setTradeGuidanceTool,
	createLibraryGroupsTool,
	updateLibraryGroupsTool,
	archiveLibraryGroupsTool,
	createWorkItemsTool,
	updateWorkItemsTool,
	archiveWorkItemsTool,
	moveWorkItemsTool,
	linkWorkItemSupplyTool,
	unlinkWorkItemSupplyTool,
	createSuppliesTool,
	updateSuppliesTool,
	archiveSuppliesTool,
];

export type { Tool, ToolContext } from "./define.js";
