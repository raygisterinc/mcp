import type { ZodRawShape, z } from "zod";
import type { RaygisterClient } from "../client.js";

export interface ToolContext {
	client: RaygisterClient;
}

export interface ToolDefinition<Shape extends ZodRawShape = ZodRawShape> {
	name: string;
	description: string;
	inputSchema: Shape;
	handler(args: z.objectOutputType<Shape, z.ZodTypeAny>, ctx: ToolContext): Promise<unknown>;
}
