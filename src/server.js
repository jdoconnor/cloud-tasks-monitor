const express = require('express');
const cors = require('cors');
const { CloudTasksClient } = require('@google-cloud/tasks');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Cloud Tasks client with emulator settings
const emulatorHost = process.env.CLOUD_TASKS_EMULATOR_HOST || 'localhost:8123';

// For the emulator, we need to configure both servicePath/port AND apiEndpoint
const [host, portStr] = emulatorHost.split(':');
const port = parseInt(portStr, 10);

const client = new CloudTasksClient({
  servicePath: host,
  port: port,
  sslCreds: require('@grpc/grpc-js').credentials.createInsecure(),
  // Also set apiEndpoint to prevent the client from trying to use production endpoints
  apiEndpoint: `${host}:${port}`
});

// Helper function to parse queue path
function parseQueuePath(queuePath) {
  const match = queuePath.match(/projects\/([^\/]+)\/locations\/([^\/]+)\/queues\/([^\/]+)/);
  if (!match) return null;
  return {
    project: match[1],
    location: match[2],
    queue: match[3]
  };
}

// API endpoint to get all queues
app.get('/api/queues', async (req, res) => {
  try {
    const project = process.env.GCP_PROJECT || 'local-project';
    const location = process.env.GCP_LOCATION || 'us-central1';
    const parent = `projects/${project}/locations/${location}`;

    const [queues] = await client.listQueues({ parent });

    const queueData = queues.map(queue => ({
      name: queue.name,
      parsedName: parseQueuePath(queue.name)?.queue || queue.name,
      state: queue.state,
      rateLimits: queue.rateLimits,
      retryConfig: queue.retryConfig
    }));

    res.json(queueData);
  } catch (error) {
    console.error('Error fetching queues:', error);
    res.status(500).json({
      error: error.message,
      details: 'Make sure the Cloud Tasks emulator is running'
    });
  }
});

// API endpoint to get tasks for a specific queue
app.get('/api/queues/:queueName/tasks', async (req, res) => {
  try {
    const project = process.env.GCP_PROJECT || 'local-project';
    const location = process.env.GCP_LOCATION || 'us-central1';
    const queueName = req.params.queueName;
    const parent = `projects/${project}/locations/${location}/queues/${queueName}`;

    const [tasks] = await client.listTasks({ parent });

    const taskData = tasks.map(task => ({
      name: task.name,
      scheduleTime: task.scheduleTime,
      createTime: task.createTime,
      dispatchDeadline: task.dispatchDeadline,
      dispatchCount: task.dispatchCount,
      responseCount: task.responseCount,
      firstAttempt: task.firstAttempt,
      lastAttempt: task.lastAttempt,
      view: task.view,
      httpRequest: task.httpRequest ? {
        url: task.httpRequest.url,
        httpMethod: task.httpRequest.httpMethod,
        headers: task.httpRequest.headers,
        body: task.httpRequest.body ? Buffer.from(task.httpRequest.body).toString('utf-8') : null
      } : null
    }));

    res.json(taskData);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      error: error.message,
      details: 'Make sure the Cloud Tasks emulator is running and the queue exists'
    });
  }
});

// API endpoint to get detailed task info
app.get('/api/tasks/:taskPath(*)', async (req, res) => {
  try {
    const taskPath = req.params.taskPath;
    const name = `projects/${taskPath}`;

    const [task] = await client.getTask({ name });

    res.json({
      name: task.name,
      scheduleTime: task.scheduleTime,
      createTime: task.createTime,
      dispatchDeadline: task.dispatchDeadline,
      dispatchCount: task.dispatchCount,
      responseCount: task.responseCount,
      firstAttempt: task.firstAttempt,
      lastAttempt: task.lastAttempt,
      httpRequest: task.httpRequest ? {
        url: task.httpRequest.url,
        httpMethod: task.httpRequest.httpMethod,
        headers: task.httpRequest.headers,
        body: task.httpRequest.body ? Buffer.from(task.httpRequest.body).toString('utf-8') : null
      } : null
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to delete a specific task
app.delete('/api/tasks/:taskPath(*)', async (req, res) => {
  try {
    const taskPath = req.params.taskPath;
    const name = `projects/${taskPath}`;

    await client.deleteTask({ name });

    res.json({
      success: true,
      message: 'Task deleted successfully',
      taskName: name
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      error: error.message,
      details: 'Failed to delete task'
    });
  }
});

// API endpoint to purge/flush all tasks in a queue
app.post('/api/queues/:queueName/purge', async (req, res) => {
  try {
    const project = process.env.GCP_PROJECT || 'local-project';
    const location = process.env.GCP_LOCATION || 'us-central1';
    const queueName = req.params.queueName;
    const name = `projects/${project}/locations/${location}/queues/${queueName}`;

    await client.purgeQueue({ name });

    res.json({
      success: true,
      message: 'Queue purged successfully',
      queueName: queueName
    });
  } catch (error) {
    console.error('Error purging queue:', error);
    res.status(500).json({
      error: error.message,
      details: 'Failed to purge queue'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    emulatorHost: process.env.CLOUD_TASKS_EMULATOR_HOST || 'localhost:8123',
    project: process.env.GCP_PROJECT || 'local-project',
    location: process.env.GCP_LOCATION || 'us-central1'
  });
});

app.listen(PORT, () => {
  console.log(`Cloud Tasks Monitor running on http://localhost:${PORT}`);
  console.log(`Emulator host: ${process.env.CLOUD_TASKS_EMULATOR_HOST || 'localhost:8123'}`);
  console.log(`Project: ${process.env.GCP_PROJECT || 'local-project'}`);
  console.log(`Location: ${process.env.GCP_LOCATION || 'us-central1'}`);
});
