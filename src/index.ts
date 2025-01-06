#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListToolsResult,
  ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Superface } from 'superface/client';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

const server = new Server(
  {
    name: 'superface',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const superface = new Superface({
    apiKey: process.env.SUPERFACE_API_KEY,
  });

  const tools = await superface.getTools();

  return {
    tools: tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      inputSchema: tool.function.parameters as ToolInput,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = { arguments: {}, ...request.params };

  console.error('call tool request', name, args);

  const superface = new Superface({
    apiKey: process.env.SUPERFACE_API_KEY,
  });

  const result = await superface.runTool({
    name,
    args,
    userId: 'shrug',
  });

  console.error('call tool result', result);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result),
      },
    ],
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Superface MCP Server running on stdio');
  console.error('Superface API key:', process.env.SUPERFACE_API_KEY);
}

try {
  void main();
} catch (error) {
  console.error('Fatal error in main():', error);
  process.exit(1);
}
