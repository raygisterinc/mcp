# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-10-29

Built on the Raygister API v1 contract of October 2026, which this version needs.

### Added

- `get_project_totals`: works HT, VAT per rate and TTC for the project and per lot, with the project manager (MOE) fees and the management fees reported apart, as the DPGF estimate prints them.
- Every tool declares an output schema and returns structured content, plus the same JSON as text.
- Every tool carries read-only annotations (`readOnlyHint`, `idempotentHint`) and a title.
- Server instructions explaining projects, lots, specifications, amounts HT and unpriced lines.
- Tests (`pnpm test`), run in CI.

### Changed

- Tool inputs are snake_case like the API: `project_id`, `lot_id`, `page`, `per_page`.
- Tool descriptions list the fields the API really returns (lot type and counts, VAT rate per line, location hierarchy and surface).
- An API refusal becomes a tool error that says what to do: create a key (401), renew the subscription (403 `moe_access_ended`), check the id (404).
- Requests time out after 30 seconds.
- Requires Node.js 22 or later. Dependencies: MCP SDK 1.32, zod 4.
- The smoke script goes through the built server over stdio, so it also checks the output schemas.

### Removed

- PostHog telemetry and the `POSTHOG_API_KEY` / `POSTHOG_HOST` variables.

## [0.1.0] - 2026-05-04

### Added

- Initial release of the Raygister MCP server.
- Stdio transport for use with Claude Desktop, Claude Code, and any MCP-compatible client.
- Six read-only tools wrapping the Raygister public API:
  - `list_projects`
  - `get_project`
  - `list_lots`
  - `get_lot`
  - `list_specifications`
  - `list_locations`
- Bearer token authentication with `dk_*` API keys.
- Optional PostHog telemetry (no-op when not configured).
- Smoke test script for end-to-end validation against a live API key.

[Unreleased]: https://github.com/raygisterinc/mcp/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/raygisterinc/mcp/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/raygisterinc/mcp/releases/tag/v0.1.0
