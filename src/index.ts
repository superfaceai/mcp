#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Superface, SuperfaceError } from 'superface/client';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import os from 'node:os';
import { join as joinPath } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

function debug(...args: any[]) {
  if (['1', 'true'].includes(process.env.SUPERFACE_MCP_DEBUG || '')) {
    console.error(...args);
  }
}

function getConfigPath() {
  let baseDir: string;
  if (process.platform === 'win32') {
    baseDir = 'AppData\\Roaming\\superface';
  } else if (process.platform === 'darwin') {
    baseDir = 'Library/Application Support/superface';
  } else {
    baseDir = '.superface';
  }

  return joinPath(os.homedir(), baseDir, 'config.json');
}

async function getConfig() {
  const userIdPath = getConfigPath();
  debug('User ID path', userIdPath);

  let config: { userId: string };
  try {
    const data = await readFile(userIdPath, 'utf8');
    config = JSON.parse(data);
    debug('Config (existing)', config);
  } catch (error) {
    config = { userId: generateUserId() };
    try {
      await mkdir(joinPath(userIdPath, '..'), { recursive: true });
      await writeFile(userIdPath, JSON.stringify(config));
      debug('Config (new)', config);
    } catch (writeError) {
      console.error('Error writing config file', writeError);
    }
  }
  return config;
}

function generateUserId() {
  return `claude-desktop-${Math.random().toString(36).substring(2)}`;
}

async function getUserId() {
  const config = await getConfig();
  return config.userId;
}

let superfaceClient: Superface | null = null;
function getSuperfaceClient() {
  if (!superfaceClient) {
    try {
      superfaceClient = new Superface({
        apiKey: process.env.SUPERFACE_API_KEY,
      });
    } catch (error) {
      if (
        error instanceof SuperfaceError &&
        error.message.includes('SUPERFACE_API_KEY')
      ) {
        throw new Error(
          'SUPERFACE_API_KEY environment variable is required to use Superface MCP Server'
        );
      }

      throw error;
    }
  }
  return superfaceClient;
}

const server = new Server(
  {
    name: 'superface',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const superface = getSuperfaceClient();
  const tools = await superface.getTools();
  debug('Tools list', JSON.stringify(tools, null, 2));

  return {
    tools: tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      inputSchema: tool.function.parameters || {},
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = { arguments: {}, ...request.params };
  debug('Calling tool', name, JSON.stringify(args, null, 2));

  const superface = getSuperfaceClient();
  const result = await superface.runTool({
    name,
    args,
    userId: await getUserId(),
  });
  debug('Tool result', JSON.stringify(result, null, 2));

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
  // load and cache tools before starting the server to solve timeout issues on messages
  const superface = getSuperfaceClient();
  await superface.getTools();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Superface MCP Server running on stdio');
}

try {
  void main();
} catch (error) {
  console.error('Fatal error, unable to start Superface MCP Server', error);
  process.exit(1);
}
