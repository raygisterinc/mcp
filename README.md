# @raygister/mcp

Read-only Model Context Protocol server for [Raygister](https://www.raygister.com), the SaaS for architects to manage construction consultation projects (DPGF, lots, specifications, locations).

[![npm version](https://img.shields.io/npm/v/@raygister/mcp.svg)](https://www.npmjs.com/package/@raygister/mcp)
[![license](https://img.shields.io/npm/l/@raygister/mcp.svg)](./LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue.svg)](https://modelcontextprotocol.io)

## Features

Six read-only tools wrapping the Raygister public API. The server is strictly read-only in v1: there are no tools that mutate state.

- **`list_projects`** browse all projects in your organization with pagination
- **`get_project`** fetch full details of a single project including counts
- **`list_lots`** list every lot (work package) of a project
- **`get_lot`** fetch a single lot with its inline specifications
- **`list_specifications`** list every DPGF line item of a lot
- **`list_locations`** list rooms, floors, and zones of a project

## Installation

Add the server to your MCP client. For Claude Desktop, edit your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "raygister": {
      "command": "npx",
      "args": ["-y", "@raygister/mcp"],
      "env": {
        "RAYGISTER_API_KEY": "dk_your_key_here"
      }
    }
  }
}
```

For Claude Code, the equivalent CLI command is:

```bash
claude mcp add raygister -- npx -y @raygister/mcp
```

then set `RAYGISTER_API_KEY` in the environment passed to the server.

## How to get an API key

1. Sign in to [app.raygister.com](https://app.raygister.com).
2. Open **Settings** then **API keys**. (TODO: confirm exact path before publishing.)
3. Create a new key. It will start with `dk_` and is shown only once. Copy it into your MCP client config.

API keys are scoped to a single organization. The Raygister backend enforces tenant isolation, so the MCP only ever sees data from the organization the key belongs to.

## Example prompts

Once the server is connected, you can ask your AI assistant things like:

- "List my Raygister projects and tell me which one has the most lots."
- "For project `Hôtel Mercure Lyon`, summarise the plumbing lot's specifications."
- "Compare the number of locations across all my active projects."
- "Show me every specification tagged 'electrical' for the office tower project."
- "Give me a high-level breakdown of lots by type for the most recently created project."

## Tool reference

| Name                  | Description                                                                 | Required inputs              |
| --------------------- | --------------------------------------------------------------------------- | ---------------------------- |
| `list_projects`       | Paginated list of projects in the organization.                             | none                         |
| `get_project`         | Single project with counts (lots, specifications, locations) and metadata.  | `projectId`                  |
| `list_lots`           | Paginated list of lots for a project.                                       | `projectId`                  |
| `get_lot`             | Single lot with full description, type, status, and inline specifications.  | `projectId`, `lotId`         |
| `list_specifications` | Paginated list of specifications (DPGF line items) for a lot.               | `projectId`, `lotId`         |
| `list_locations`      | Flat list of all locations for a project. Not paginated.                    | `projectId`                  |

Pagination tools also accept `page` (default 1) and `per_page` (default 20, max 100).

## Configuration

| Variable             | Required | Default                          | Description                                                          |
| -------------------- | -------- | -------------------------------- | -------------------------------------------------------------------- |
| `RAYGISTER_API_KEY`  | yes      | none                             | API key starting with `dk_`. Get one from your Raygister settings.   |
| `RAYGISTER_API_URL`  | no       | `https://app.raygister.com/api`  | Override the API base URL. Useful for staging or local development.  |
| `POSTHOG_API_KEY`    | no       | none                             | Enables anonymous tool-call telemetry. Disabled when unset.          |
| `POSTHOG_HOST`       | no       | `https://eu.posthog.com`         | PostHog instance to send events to.                                  |

When `POSTHOG_API_KEY` is unset, the telemetry layer is a strict no-op. When set, it captures only the tool name, success flag, duration, and a hash-derived install identifier. The raw API key is never sent.

## Local development

```bash
git clone https://github.com/raygisterinc/mcp.git
cd mcp
pnpm install
pnpm build
```

To iterate, run `pnpm dev` to rebuild on save.

To test against a local Raygister API:

```bash
export RAYGISTER_API_KEY=dk_your_local_key
export RAYGISTER_API_URL=http://localhost:3000/api
node dist/index.js
```

The MCP server speaks JSON-RPC over stdio. To exercise it without a client, use the smoke script:

```bash
export RAYGISTER_API_KEY=dk_your_key
pnpm smoke
```

The script calls each tool sequentially and prints success or failure per endpoint.

## Contributing

Issues and pull requests welcome at [github.com/raygisterinc/mcp](https://github.com/raygisterinc/mcp). Please open an issue first if you plan a non-trivial change.

## License

MIT, see [LICENSE](./LICENSE).
