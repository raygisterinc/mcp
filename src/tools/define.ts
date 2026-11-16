import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";
import type { RaygisterClient } from "../client.js";

export interface ToolContext {
	client: RaygisterClient;
}

export interface Tool {
	name: string;
	register(server: McpServer, ctx: ToolContext): void;
}

/**
 * What a tool does to the organization's data. Reads change nothing; a create
 * adds rows; an update or an archive changes rows (reversible: the API
 * deletes nothing for good).
 */
export type ToolEffect = "read" | "create" | "update";

interface ToolSpec<Input extends z.ZodObject> {
	/** Read when left out. */
	effect?: ToolEffect;
	name: string;
	title: string;
	description: string;
	inputSchema: Input;
	outputSchema: z.ZodObject;
	/** What the tool returns; the server checks it against outputSchema. */
	run(args: z.infer<Input>, ctx: ToolContext): Promise<Record<string, unknown>>;
}

/** Every tool sees only the key's organization, through the API. */
const ANNOTATIONS: Record<
	ToolEffect,
	{ destructiveHint: boolean; idempotentHint: boolean; openWorldHint: false; readOnlyHint: boolean }
> = {
	create: {
		destructiveHint: false,
		idempotentHint: false,
		openWorldHint: false,
		readOnlyHint: false,
	},
	read: { destructiveHint: false, idempotentHint: true, openWorldHint: false, readOnlyHint: true },
	update: { destructiveHint: true, idempotentHint: true, openWorldHint: false, readOnlyHint: false },
};

/**
 * A tool answers twice: `structuredContent` for clients that read the output
 * schema, and the same JSON as text for the others. A thrown error (an API
 * refusal included) becomes a tool error carrying its message.
 */
export function defineTool<Input extends z.ZodObject>(spec: ToolSpec<Input>): Tool {
	return {
		name: spec.name,
		register(server, ctx) {
			// Widened so the SDK's callback type resolves; run() keeps the precise one.
			const inputSchema: z.ZodObject = spec.inputSchema;
			server.registerTool(
				spec.name,
				{
					annotations: { ...ANNOTATIONS[spec.effect ?? "read"], title: spec.title },
					description: spec.description,
					inputSchema,
					outputSchema: spec.outputSchema,
					title: spec.title,
				},
				async (args) => {
					const result = await spec.run(args as z.infer<Input>, ctx);
					return {
						content: [{ text: JSON.stringify(result), type: "text" }],
						structuredContent: result,
					};
				}
			);
		},
	};
}

/** A path segment from an id the input schema already checked. */
export function segment(id: string): string {
	return encodeURIComponent(id);
}
