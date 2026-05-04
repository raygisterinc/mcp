import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient, RaygisterApiError } from "./client.js";
import { loadEnv } from "./env.js";
import { logger } from "./logger.js";
import { createTelemetry } from "./telemetry.js";
import { tools } from "./tools/index.js";

const SERVER_NAME = "raygister-mcp";
const SERVER_VERSION = "0.1.0";

async function main(): Promise<void> {
	let env: ReturnType<typeof loadEnv>;
	try {
		env = loadEnv();
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : String(cause);
		process.stderr.write(`${message}\n`);
		process.exit(1);
	}

	const client = createClient(env);
	const telemetry = createTelemetry(env);

	const server = new McpServer({
		name: SERVER_NAME,
		version: SERVER_VERSION,
	});

	for (const tool of tools) {
		server.registerTool(
			tool.name,
			{
				description: tool.description,
				inputSchema: tool.inputSchema,
			},
			async (args: unknown) => {
				const startedAt = Date.now();
				try {
					const result = await tool.handler(
						args as Parameters<typeof tool.handler>[0],
						{ client }
					);
					telemetry.track({
						tool: tool.name,
						success: true,
						durationMs: Date.now() - startedAt,
					});
					return {
						content: [
							{
								type: "text" as const,
								text: JSON.stringify(result, null, 2),
							},
						],
					};
				} catch (cause) {
					const isApiError = cause instanceof RaygisterApiError;
					const status = isApiError ? cause.status : "unknown";
					const message =
						cause instanceof Error ? cause.message : String(cause);
					logger.error("tool failed", {
						tool: tool.name,
						status,
						message,
					});
					telemetry.track({
						tool: tool.name,
						success: false,
						durationMs: Date.now() - startedAt,
						errorCode: status,
					});
					return {
						isError: true,
						content: [
							{
								type: "text" as const,
								text: `Tool ${tool.name} failed: ${message}`,
							},
						],
					};
				}
			}
		);
	}

	const transport = new StdioServerTransport();

	const shutdown = async (signal: string): Promise<void> => {
		logger.info("shutting down", { signal });
		try {
			await server.close();
		} catch (cause) {
			const message = cause instanceof Error ? cause.message : String(cause);
			logger.warn("server close failed", { message });
		}
		await telemetry.shutdown();
		process.exit(0);
	};

	process.on("SIGINT", () => {
		void shutdown("SIGINT");
	});
	process.on("SIGTERM", () => {
		void shutdown("SIGTERM");
	});

	await server.connect(transport);
	logger.info("raygister-mcp ready", {
		version: SERVER_VERSION,
		apiUrl: env.RAYGISTER_API_URL,
		tools: tools.length,
	});
}

main().catch((cause) => {
	const message = cause instanceof Error ? cause.message : String(cause);
	process.stderr.write(`fatal: ${message}\n`);
	process.exit(1);
});
