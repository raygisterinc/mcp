# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/raygister/mcp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/raygister/mcp/releases/tag/v0.1.0
