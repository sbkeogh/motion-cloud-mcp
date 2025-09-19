const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

const MOTION_API_KEY = process.env.MOTION_API_KEY;
const MOTION_BASE_URL = "https://api.usemotion.com/v1";

// Helper function to make Motion API requests
async function makeMotionRequest(endpoint, options = {}) {
  const response = await fetch(`${MOTION_BASE_URL}/${endpoint}`, {
    ...options,
    headers: {
      'X-API-Key': MOTION_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Motion API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// MCP Server Implementation
app.post('/mcp', async (req, res) => {
  try {
    const { method, params } = req.body;

    switch (method) {
      case 'tools/list':
        return res.json({
          tools: [
            {
              name: 'motion_get_workspaces',
              description: 'Get all workspaces from Motion.ai',
              inputSchema: {
                type: 'object',
                properties: {},
                required: []
              }
            },
            {
              name: 'motion_get_tasks',
              description: 'Get tasks from Motion.ai',
              inputSchema: {
                type: 'object',
                properties: {
                  workspaceId: {
                    type: 'string',
                    description: 'Optional workspace ID to filter tasks'
                  }
                },
                required: []
              }
            },
            {
              name: 'motion_create_task',
              description: 'Create a new task in Motion.ai',
              inputSchema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Task name'
                  },
                  priority: {
                    type: 'string',
                    description: 'Task priority (LOW, MEDIUM, HIGH)',
                    enum: ['LOW', 'MEDIUM', 'HIGH']
                  },
                  description: {
                    type: 'string',
                    description: 'Optional task description'
                  },
                  workspaceId: {
                    type: 'string',
                    description: 'Optional workspace ID'
                  }
                },
                required: ['name']
              }
            }
          ]
        });

      case 'tools/call':
        const { name, arguments: args } = params;
        
        switch (name) {
          case 'motion_get_workspaces':
            const workspacesData = await makeMotionRequest('workspaces');
            return res.json({
              content: [{
                type: 'text',
                text: JSON.stringify(workspacesData.workspaces || [], null, 2)
              }]
            });

          case 'motion_get_tasks':
            let tasksEndpoint = 'tasks';
            if (args?.workspaceId) {
              tasksEndpoint += `?workspaceId=${args.workspaceId}`;
            }
            const tasksData = await makeMotionRequest(tasksEndpoint);
            return res.json({
              content: [{
                type: 'text',
                text: JSON.stringify(tasksData.tasks || [], null, 2)
              }]
            });

          case 'motion_create_task':
            // Get default workspace if none provided
            let workspaceId = args.workspaceId;
            if (!workspaceId) {
              const workspacesResponse = await makeMotionRequest('workspaces');
              const workspaces = workspacesResponse.workspaces || [];
              if (workspaces.length > 0) {
                workspaceId = workspaces[0].id;
              } else {
                throw new Error('No workspaces available');
              }
            }

            const taskData = {
              name: args.name,
              workspaceId: workspaceId,
              priority: (args.priority || 'MEDIUM').toUpperCase()
            };

            if (args.description) {
              taskData.description = args.description;
            }

            const newTask = await makeMotionRequest('tasks', {
              method: 'POST',
              body: JSON.stringify(taskData)
            });

            return res.json({
              content: [{
                type: 'text',
                text: `✅ Task "${newTask.name}" created successfully!\nTask ID: ${newTask.id}\nPriority: ${newTask.priority}`
              }]
            });

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

      default:
        return res.status(400).json({ error: `Unknown method: ${method}` });
    }
  } catch (error) {
    console.error('MCP Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Motion.ai MCP Server' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Motion.ai MCP Server',
    endpoints: {
      mcp: '/mcp',
      health: '/health'
    }
  });
});

module.exports = app;