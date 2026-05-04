/**
 * Stderr-only logger. Stdout is reserved for the MCP protocol on stdio transport,
 * so any human-readable diagnostic must go to stderr to avoid corrupting the stream.
 */

type LogLevel = "info" | "warn" | "error";

function format(level: LogLevel, message: string, context?: Record<string, unknown>): string {
	const timestamp = new Date().toISOString();
	const ctx = context ? ` ${JSON.stringify(context)}` : "";
	return `[${timestamp}] [${level}] ${message}${ctx}\n`;
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
	process.stderr.write(format(level, message, context));
}

export const logger = {
	info(message: string, context?: Record<string, unknown>): void {
		write("info", message, context);
	},
	warn(message: string, context?: Record<string, unknown>): void {
		write("warn", message, context);
	},
	error(message: string, context?: Record<string, unknown>): void {
		write("error", message, context);
	},
};
