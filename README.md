# @raygister/mcp

Read-only Model Context Protocol server for [Raygister](https://www.raygister.com), the platform where architects and project managers describe construction projects in lots and specifications (DPGF), consult companies and award markets.

[![npm version](https://img.shields.io/npm/v/@raygister/mcp.svg)](https://www.npmjs.com/package/@raygister/mcp)
[![license](https://img.shields.io/npm/l/@raygister/mcp.svg)](./LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue.svg)](https://modelcontextprotocol.io)

## Features

Seven read-only tools over the Raygister public API. No tool changes anything, and every tool sees only the organization the API key belongs to.

- **`list_projects`** browse the organization's projects
- **`get_project`** read one project: phase, client, address, dates, forecast budget, fee settings
- **`get_project_totals`** a project's amounts: works HT, VAT per rate and TTC, per lot too, with fees apart
- **`list_lots`** the lots of a project, one per trade, with their type, status and line counts
- **`get_lot`** one lot with all its specifications in a single call
- **`list_specifications`** the lines of a lot: quantity, unit, unit price, VAT rate, norms
- **`list_locations`** the rooms, floors and zones of a project, with their hierarchy and surface

Every tool returns structured content matching its output schema, plus the same JSON as text for clients that ignore schemas.

## Installation

Requires Node.js 22 or later.

For Claude Desktop, edit your `claude_desktop_config.json`:

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

For Claude Code:

```bash
claude mcp add raygister --env RAYGISTER_API_KEY=dk_your_key_here -- npx -y @raygister/mcp
```

Without a key the server exits at startup, which MCP clients report as a closed connection.

## How to get an API key

1. Sign in to [app.raygister.com](https://app.raygister.com).
2. Open **Settings** then **API keys** (`/settings/api-keys`).
3. Create a key. It starts with `dk_` and is shown only once: copy it into your MCP client config.

A key belongs to one organization and reads only its data. It stops working when it is revoked, and while the organization's access to the project manager space has ended (the tools then say so); renewing the subscription restores it.

## Amounts

Amounts are excluding VAT (HT), in the project's currency, unless a field says `ttc` or `vat`. A `unit_price` of `null` means the line is not priced yet; `0` is a price. `get_project_totals` computes the totals the way the DPGF estimate prints them, so prefer it to adding lines up: the project manager (MOE) fees and the management fees are reported beside the works, never added to them.

## Example prompts

- "List my Raygister projects and tell me which one has the most lots."
- "What is the total of the Martin apartment, excluding and including VAT, lot by lot?"
- "Which lines of the electricity lot are not priced yet?"
- "Summarise the plumbing lot's specifications with their quantities and units."
- "How many square metres do the rooms of the first floor add up to?"

## Tool reference

| Name                  | Returns                                                                       | Required inputs          |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------ |
| `list_projects`       | `{ projects, pagination }`, sorted by name.                                   | none                     |
| `get_project`         | One project.                                                                  | `project_id`             |
| `get_project_totals`  | `{ works, fees, lots, specifications_count, unpriced_specifications_count }`. | `project_id`             |
| `list_lots`           | `{ lots, pagination }`, in grid order.                                        | `project_id`             |
| `get_lot`             | One lot with `specifications` (up to 1000).                                   | `project_id`, `lot_id`   |
| `list_specifications` | `{ specifications, pagination }`, in grid order.                              | `project_id`, `lot_id`   |
| `list_locations`      | `{ locations }`, not paginated.                                               | `project_id`             |

Paginated tools also accept `page` (default 1) and `per_page` (default 20, max 100).

When the API refuses a call, the tool answers with an error that says what to do: create a key (401), renew the subscription (403), or check the id (404).

## Configuration

| Variable            | Required | Default                         | Description                                                    |
| ------------------- | -------- | ------------------------------- | -------------------------------------------------------------- |
| `RAYGISTER_API_KEY` | yes      | none                            | API key starting with `dk_`, from Settings > API keys.         |
| `RAYGISTER_API_URL` | no       | `https://app.raygister.com/api` | API base URL, to point at a staging or local Raygister.        |

The server sends nothing anywhere but the Raygister API.

## Local development

```bash
git clone https://github.com/raygisterinc/mcp.git
cd mcp
pnpm install
pnpm test
pnpm build
```

`pnpm dev` rebuilds on save.

To try it against a local Raygister (the app serves the API on port 3000):

```bash
export RAYGISTER_API_KEY=dk_your_local_key
export RAYGISTER_API_URL=http://localhost:3000/api
pnpm smoke
```

The smoke script builds the server, starts it over stdio like an MCP client would, and calls every tool on the first project and lot it finds. The server checks each answer against the tool's output schema, so a drift between the API and the schemas fails there.

## Contributing

Issues and pull requests welcome at [github.com/raygisterinc/mcp](https://github.com/raygisterinc/mcp). Please open an issue first if you plan a non-trivial change.

## License

MIT, see [LICENSE](./LICENSE).
