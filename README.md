# Cloud Tasks Monitor

A web-based UI for monitoring Google Cloud Tasks Emulator. This tool provides real-time visibility into your Cloud Tasks queues and tasks during local development.

## Features

- **Queue Monitoring**: View all queues with their current state and configuration
- **Task Inspection**: Drill down into individual tasks to see:
  - HTTP request details (method, URL, headers, body)
  - Schedule and dispatch times
  - Retry attempts and counts
- **Real-time Updates**: Auto-refresh capability to monitor tasks as they're processed
- **Docker Ready**: Fully containerized for easy integration into your development environment

## Quick Start

### Using Docker Compose (Recommended)

1. Build and start the services:
```bash
docker-compose up --build
```

2. Access the UI at http://localhost:3001

The docker-compose setup includes both the Cloud Tasks Emulator and the Monitor UI.

### Using with Existing Docker Setup

If you already have a Cloud Tasks emulator running (e.g., in your main application's docker-compose), you can add the monitor service:

```yaml
services:
  cloud-tasks-monitor:
    build: /path/to/cloud-tasks-monitor
    ports:
      - "3001:3001"
    environment:
      - CLOUD_TASKS_EMULATOR_HOST=cloud-tasks-emulator:8123
      - GCP_PROJECT=your-project-id
      - GCP_LOCATION=us-central1
    networks:
      - your-network
```

Make sure to:
- Connect to the same network as your Cloud Tasks emulator
- Update `CLOUD_TASKS_EMULATOR_HOST` to match your emulator's service name and port
- Update `GCP_PROJECT` and `GCP_LOCATION` to match your configuration

### Local Development (Without Docker)

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export CLOUD_TASKS_EMULATOR_HOST=localhost:8123
export GCP_PROJECT=local-project
export GCP_LOCATION=us-central1
```

3. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

4. Access the UI at http://localhost:3001

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port for the web server | `3001` |
| `CLOUD_TASKS_EMULATOR_HOST` | Cloud Tasks emulator address | `localhost:8123` |
| `GCP_PROJECT` | GCP project ID | `local-project` |
| `GCP_LOCATION` | GCP location/region | `us-central1` |

## Integration with Your App

### Example: Adding to an Existing docker-compose.yml

If you have a docker-compose file like this:

```yaml
services:
  cloud-tasks-emulator:
    image: ghcr.io/aertje/cloud-tasks-emulator:latest
    ports:
      - "8123:8123"
    # ... your config

  your-app:
    # ... your app config
```

Add the monitor service:

```yaml
services:
  cloud-tasks-emulator:
    image: ghcr.io/aertje/cloud-tasks-emulator:latest
    ports:
      - "8123:8123"
    networks:
      - app-network

  your-app:
    # ... your app config

  cloud-tasks-monitor:
    build: /path/to/cloud-tasks-monitor
    ports:
      - "3001:3001"
    environment:
      - CLOUD_TASKS_EMULATOR_HOST=cloud-tasks-emulator:8123
      - GCP_PROJECT=your-project-id
      - GCP_LOCATION=us-central1
    depends_on:
      - cloud-tasks-emulator
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## API Endpoints

The monitor exposes the following REST API endpoints:

- `GET /api/health` - Health check and configuration info
- `GET /api/queues` - List all queues
- `GET /api/queues/:queueName/tasks` - List tasks in a specific queue
- `GET /api/tasks/:taskPath` - Get detailed task information

## Usage Tips

1. **Auto-refresh**: Enable auto-refresh to monitor tasks in real-time as they're created and processed
2. **Click to expand**: Click on any task row to view detailed headers and request body
3. **Queue selection**: Click on a queue card to view its tasks
4. **JSON formatting**: Request bodies are automatically formatted if they contain valid JSON

## Troubleshooting

### "Error connecting to emulator"

- Verify the Cloud Tasks emulator is running
- Check that `CLOUD_TASKS_EMULATOR_HOST` matches your emulator's address
- Ensure the monitor and emulator are on the same Docker network (if using Docker)

### "No queues found"

- Make sure your application has created at least one queue
- Verify the `GCP_PROJECT` and `GCP_LOCATION` environment variables match your emulator configuration
- Check the emulator's queue.yaml configuration

### Network connectivity issues in Docker

- Ensure all services are on the same Docker network
- Use service names (not localhost) when referencing other containers
- Check Docker network configuration with `docker network inspect <network-name>`

## Screenshots

The UI provides:
- A header showing connection status and configuration
- Grid of queue cards showing queue name and state
- Task table with expandable rows for detailed inspection
- Auto-refresh controls for real-time monitoring

## License

MIT
