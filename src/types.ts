import { z } from "zod";

/**
 * Loose schemas for the Raygister public API.
 * We use passthrough so server-side additions do not break the MCP at runtime,
 * and we only assert on the fields the AI actually needs to chain calls.
 */

export const PaginationMetaSchema = z.object({
	page: z.number().int().nonnegative(),
	per_page: z.number().int().positive(),
	total: z.number().int().nonnegative(),
	total_pages: z.number().int().nonnegative(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export const PaginatedResponseSchema = z.object({
	data: z.array(z.record(z.unknown())),
	pagination: PaginationMetaSchema,
});

export const SingleResponseSchema = z.object({
	data: z.record(z.unknown()),
});

export const ListResponseSchema = z.object({
	data: z.array(z.record(z.unknown())),
});

export const ErrorResponseSchema = z.object({
	error: z.string(),
});

export type PaginatedResponse<T = Record<string, unknown>> = {
	data: T[];
	pagination: PaginationMeta;
};

export type SingleResponse<T = Record<string, unknown>> = {
	data: T;
};

export type ListResponse<T = Record<string, unknown>> = {
	data: T[];
};
