import { getLotTool } from "./get-lot.js";
import { getProjectTool } from "./get-project.js";
import { listLocationsTool } from "./list-locations.js";
import { listLotsTool } from "./list-lots.js";
import { listProjectsTool } from "./list-projects.js";
import { listSpecificationsTool } from "./list-specifications.js";
import type { ToolDefinition } from "./types.js";

export const tools: ToolDefinition[] = [
	listProjectsTool,
	getProjectTool,
	listLotsTool,
	getLotTool,
	listSpecificationsTool,
	listLocationsTool,
];

export type { ToolContext, ToolDefinition } from "./types.js";
