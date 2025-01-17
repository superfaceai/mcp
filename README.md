[Website](https://superface.ai) | [Documentation](https://docs.superface.ai) | [X (Twitter)](https://twitter.com/superfaceai) | [Support](mailto:support@superface.ai)

<img src="https://github.com/superfaceai/mcp_server/raw/main/docs/superface.png" alt="Superface" width="60" />

# Superface MCP Server

Use Superface tools via Model Context Protocol.

## Setup

### Adding tools & obtaining API Key

1. Go to the [Superface dashboard](https://pod.superface.ai/hub/api)
2. Select and add the tools you want to use with MCP Server
3. Copy your API key in the dashboard

You'll need this API key for the MCP Server configuration.

### Usage with Claude Desktop

1. Open Claude Desktop
2. Go to Settings (click on your profile picture or <kbd>⌘</kbd> + <kbd>,</kbd>)
3. Open "Developer" tab
4. Click "Edit Config"
5. Open `claude_desktop_config.json` file
6. Add the following configuration:

#### NPX
```json
{
  "mcpServers": {
    "superface": {
      "command": "npx",
      "args": [
        "-y",
        "@superfaceai/mcp"
      ],
      "env": {
        "SUPERFACE_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

#### Docker
```json
{
  "mcpServers": {
    "superface": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "SUPERFACE_API_KEY",
        "mcp/superface"
      ],
      "env": {
        "SUPERFACE_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

## Build

Docker build:

```bash
docker build -t mcp/superface .
```

## License

This project is licensed under the MIT license. See the [LICENSE](./LICENSE) file for details.
