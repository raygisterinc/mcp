import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "./client.js";
import { type Env, loadEnv } from "./env.js";
import { logger } from "./logger.js";
import { createServer } from "./server.js";
import { tools } from "./tools/index.js";
import { VERSION } from "./version.js";

async function main(): Promise<void> {
	let env: Env;
	try {
		env = loadEnv();
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : String(cause);
		process.stderr.write(`${message}\n`);
		process.exit(1);
	}

	const server = createServer(createClient(env));

	const shutdown = async (signal: string): Promise<void> => {
		logger.info("shutting down", { signal });
		try {
			await server.close();
		} catch (cause) {
			const message = cause instanceof Error ? cause.message : String(cause);
			logger.warn("server close failed", { message });
		}
		process.exit(0);
	};

	process.on("SIGINT", () => {
		void shutdown("SIGINT");
	});
	process.on("SIGTERM", () => {
		void shutdown("SIGTERM");
	});

	await server.connect(new StdioServerTransport());
	logger.info("raygister-mcp ready", {
		apiUrl: env.RAYGISTER_API_URL,
		tools: tools.length,
		version: VERSION,
	});
}

main().catch((cause) => {
	const message = cause instanceof Error ? cause.message : String(cause);
	process.stderr.write(`fatal: ${message}\n`);
	process.exit(1);
});
