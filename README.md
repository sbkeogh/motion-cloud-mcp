# Motion.ai MCP Server for Claude

A cloud-deployable MCP (Model Context Protocol) server that connects regular Claude (claude.ai) to Motion.ai for task management.

## Features

- Create tasks in Motion.ai
- Get tasks and workspaces
- Full Motion.ai API integration
- Works with regular Claude through Integrations

## Deploy to Vercel

1. Fork this repository
2. Connect to Vercel
3. Add environment variable: `MOTION_API_KEY`
4. Deploy
5. Add the URL to Claude.ai Integrations

## Environment Variables

- `MOTION_API_KEY` - Your Motion.ai API key

## Usage

Once deployed, add the URL to Claude.ai Settings > Integrations:
- URL: `https://your-vercel-url.vercel.app/mcp`

Then ask Claude:
- "Show me my Motion.ai tasks"
- "Create a task called 'Call Stuart' with high priority"