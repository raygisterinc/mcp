import type { Tool } from "./define.js";
import { getLotTool } from "./get-lot.js";
import { getProjectTool } from "./get-project.js";
import { getProjectTotalsTool } from "./get-project-totals.js";
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
];

export type { Tool, ToolContext } from "./define.js";
