# @raygister/mcp (deprecated)

This package is no longer maintained. Raygister now serves its MCP server itself:

```
https://app.raygister.com/mcp
```

Add that URL as a connector in Claude, ChatGPT, Cursor, VS Code or Claude Code, sign in with your Raygister account and choose your organization. No API key and nothing to install. Setup for each client: [raygister.com/en/mcp](https://www.raygister.com/en/mcp) ([version française](https://www.raygister.com/mcp)).

The remote server has the same 30 tools as this package's last version (0.3.0), and acts as you, with your role in the organization you chose. You can disconnect it at any time from Raygister (Settings, API keys, Connected assistants).

## Moving from this package

1. Remove the `raygister` entry that runs `npx @raygister/mcp` from your client's MCP configuration.
2. Add `https://app.raygister.com/mcp` as a remote server. For Claude Code:

   ```bash
   claude mcp add --transport http raygister https://app.raygister.com/mcp
   ```

3. Revoke the API key you created for this package, in Raygister under Settings, API keys, if you no longer use it for scripts.

Installed versions keep working with their API key until you remove them, but they get no new tools or fixes.

## License

MIT
