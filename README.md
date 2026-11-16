# @raygister/mcp

Model Context Protocol server for [Raygister](https://www.raygister.com), the platform where architects and project managers describe construction projects in lots and specifications (DPGF), consult companies and award markets.

[![npm version](https://img.shields.io/npm/v/@raygister/mcp.svg)](https://www.npmjs.com/package/@raygister/mcp)
[![license](https://img.shields.io/npm/l/@raygister/mcp.svg)](./LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue.svg)](https://modelcontextprotocol.io)

## Features

Thirty tools over the Raygister public API: seven that read projects, eight that read the organization's library and fifteen that write it. Projects are read-only. Every tool sees only the organization the API key belongs to.

- **`list_projects`** browse the organization's projects
- **`get_project`** read one project: phase, client, address, dates, forecast budget, fee settings
- **`get_project_totals`** a project's amounts: works HT, VAT per rate and TTC, per lot too, with fees apart
- **`list_lots`** the lots of a project, one per trade, with their type, status and line counts
- **`get_lot`** one lot with all its specifications in a single call
- **`list_specifications`** the lines of a lot: quantity, unit, unit price, VAT rate, norms
- **`list_locations`** the rooms, floors and zones of a project, with their hierarchy and surface
- **`list_trades`**, **`get_trade`** the library's trades (lot types) with their prefix and AI guidance
- **`list_library_groups`**, **`get_library_group`** the library's groups, which a project's lot is created from
- **`list_work_items`**, **`get_work_item`** the library's work items: reusable lines with a reference price and their supplies
- **`list_supplies`**, **`get_supply`** the library's supplies: the products the organization prescribes
- **`create_trades`**, **`update_trades`**, **`set_trade_guidance`** write the trades and their AI guidance (admins)
- **`create_library_groups`**, **`update_library_groups`**, **`archive_library_groups`** write the groups
- **`create_work_items`**, **`update_work_items`**, **`archive_work_items`**, **`move_work_items`** write the work items: load a price list in batches of 100
- **`link_work_item_supply`**, **`unlink_work_item_supply`** the supplies a work item prescribes
- **`create_supplies`**, **`update_supplies`**, **`archive_supplies`** write the supplies

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

A key is personal: it acts as the member who created it, in their organization, with their current role. Admins write trades; admins and members write groups, work items and supplies; a viewer's key only reads. It stops working when it is revoked or when its creator leaves the organization. While the organization's access to the project manager space has ended, the project tools say so and the library tools keep working; renewing the subscription restores the projects.

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
| `list_trades`         | `{ trades, pagination }`, by name, hidden ones included.                      | none                     |
| `get_trade`           | One trade with its guidance.                                                  | `trade_id`               |
| `list_library_groups` | `{ groups, pagination }`, in library order; `archived`.                       | none                     |
| `get_library_group`   | One library group.                                                            | `group_id`               |
| `list_work_items`     | `{ work_items, pagination }`, by name; `group_id`, `trade_id`, `archived`, `search`. | none              |
| `get_work_item`       | One work item with its supplies.                                              | `work_item_id`           |
| `list_supplies`       | `{ supplies, pagination }`, by name; `archived`, `search`.                    | none                     |
| `get_supply`          | One supply.                                                                   | `supply_id`              |

Every write answers `{ ids }`, in the order of its input. A create or an update takes up to 100 `items` and lands whole or not at all. Archiving is reversible: no tool deletes anything for good.

| Name                      | Writes                                                            | Required inputs             |
| ------------------------- | ----------------------------------------------------------------- | --------------------------- |
| `create_trades`           | Trades with a unique name and prefix, an icon, guidance (admins). | `items[].name`, `.prefix`   |
| `update_trades`           | Name, prefix, icon, hidden (admins).                              | `items[].id`                |
| `set_trade_guidance`      | Description, vocabulary, AI guidelines (admins).                  | `trade_id`                  |
| `create_library_groups`   | Groups under a trade.                                             | `items[].trade_id`          |
| `update_library_groups`   | Any field of a group.                                             | `items[].id`                |
| `archive_library_groups`  | Archive (`archived: true`) or restore.                            | `ids`, `archived`           |
| `create_work_items`       | Work items in a group (`group_id`) or under a trade (`trade_id`). | `items[].name`              |
| `update_work_items`       | Any field of a work item.                                         | `items[].id`                |
| `archive_work_items`      | Archive or restore.                                               | `ids`, `archived`           |
| `move_work_items`         | To the end of a group, or out of it (`group_id: null`).           | `ids`, `group_id`           |
| `link_work_item_supply`   | A supply the work item prescribes.                                | `work_item_id`, `supply_id` |
| `unlink_work_item_supply` | Takes the supply off; it stays in the library.                    | `work_item_id`, `supply_id` |
| `create_supplies`         | Supplies (their photos are set in Raygister).                     | `items[].name`              |
| `update_supplies`         | Any field of a supply.                                            | `items[].id`                |
| `archive_supplies`        | Archive or restore.                                               | `ids`, `archived`           |

Paginated tools also accept `page` (default 1) and `per_page` (default 20, max 100).

When the API refuses a call, the tool answers with an error that says what to do: create a key (401), renew the subscription or use a key whose role allows the write (403), check the id (404), or fix the field it names (422, nothing was written).

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

The smoke script builds the server, starts it over stdio like an MCP client would, and calls every read tool on the first project and lot it finds. It writes nothing. The server checks each answer against the tool's output schema, so a drift between the API and the schemas fails there.

## Contributing

Issues and pull requests welcome at [github.com/raygisterinc/mcp](https://github.com/raygisterinc/mcp). Please open an issue first if you plan a non-trivial change.

## License

MIT, see [LICENSE](./LICENSE).
