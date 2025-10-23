# Resource Usage Log System

A comprehensive system for monitoring and logging server resource usage with automated collection, job queues, and REST API endpoints.

## Features

- **Automated Resource Collection**: Daily collection at 6:00 AM UTC using node-cron
- **Job Queue System**: BullMQ with Redis for reliable job processing
- **REST API**: Complete API for querying resource usage data
- **Statistics**: Built-in analytics for CPU, memory, and disk usage
- **Manual Triggers**: On-demand resource collection
- **Database**: MySQL with Drizzle ORM

## Architecture

### Components

1. **API Server** (`src/index.ts`): Main Hono server with resource usage endpoints
2. **Worker** (`src/worker/`): BullMQ worker for processing resource collection jobs
3. **Scheduler** (`src/scheduler/`): Cron scheduler for automated daily collection
4. **Queue** (`src/lib/queue.ts`): BullMQ queue configuration
5. **Database** (`src/db/`): Drizzle ORM setup with MySQL

### Data Flow

1. Scheduler triggers daily collection at 6:00 AM UTC
2. Job is added to BullMQ queue
3. Worker processes the job using systeminformation
4. Resource data is saved to MySQL database
5. API endpoints provide access to collected data

## Setup

### Prerequisites

- Node.js 18+
- MySQL database
- Redis server

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=resource_usage

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# API
PORT=3000
APP_API_KEY=your_api_key

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

### Installation

```bash
npm install
```

### Database Setup

Run the database migrations:

```bash
npx drizzle-kit push
```

## Running the System

### Development Mode

Start all components in separate terminals:

```bash
# 1. Start the API server
npm run dev

# 2. Start the worker
npm run worker:dev

# 3. Start the scheduler
npm run scheduler:dev
```

### Production Mode

```bash
# Build the project
npm run build

# Start pm2 ecosystem.config.cjs
pm2 start ecosystem.config.cjs

# check status
pm2 status
pm2 logs
pm2 save
pm2 startup
```

## API Endpoints

All endpoints are prefixed with `/api/resource-usage`

### GET `/`

Get paginated resource usage data

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `startDate` (optional): Filter from date (ISO string)
- `endDate` (optional): Filter to date (ISO string)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cpu_usage": 25.5,
      "memory_used_mb": 2048,
      "memory_total_mb": 8192,
      "disk_used_mb": 50000,
      "disk_total_mb": 100000,
      "created_at": "2024-01-01T06:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### GET `/latest`

Get the most recent resource usage data

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "cpu_usage": 25.5,
    "memory_used_mb": 2048,
    "memory_total_mb": 8192,
    "disk_used_mb": 50000,
    "disk_total_mb": 100000,
    "created_at": "2024-01-01T06:00:00.000Z"
  }
}
```

### GET `/stats`

Get resource usage statistics

**Query Parameters:**

- `startDate` (optional): Filter from date (ISO string)
- `endDate` (optional): Filter to date (ISO string)

**Response:**

```json
{
  "success": true,
  "data": {
    "cpu": {
      "avg": 25.5,
      "min": 10.2,
      "max": 45.8
    },
    "memory": {
      "avg": 65.2,
      "min": 45.1,
      "max": 85.3
    },
    "disk": {
      "avg": 50.0,
      "min": 45.2,
      "max": 55.8
    },
    "totalRecords": 30,
    "dateRange": {
      "start": "2024-01-01T06:00:00.000Z",
      "end": "2024-01-30T06:00:00.000Z"
    }
  }
}
```

### POST `/collect`

Trigger manual resource usage collection

**Response:**

```json
{
  "success": true,
  "message": "Resource usage collection job added to queue",
  "jobId": "12345"
}
```

## Database Schema

The system uses a single table `resource_usage` with the following structure:

```sql
CREATE TABLE resource_usage (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cpu_usage FLOAT NOT NULL,
  memory_used_mb BIGINT UNSIGNED NOT NULL,
  memory_total_mb BIGINT UNSIGNED NOT NULL,
  disk_used_mb BIGINT UNSIGNED NOT NULL,
  disk_total_mb BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Monitoring

### Logs

The system generates structured logs using Pino:

- Console output (development)
- File logs in `src/logs/` directory
- Log level configurable via `LOG_LEVEL` environment variable

### Job Queue Monitoring

Monitor BullMQ jobs through Redis or use the BullMQ dashboard:

```bash
# Install BullMQ dashboard
npm install -g bullmq-dashboard

# Start dashboard
bullmq-dashboard
```

## Troubleshooting

### Common Issues

1. **Redis Connection**: Ensure Redis is running and accessible
2. **Database Connection**: Verify MySQL credentials and database exists
3. **Worker Not Processing**: Check Redis connection and worker logs
4. **Scheduler Not Running**: Verify cron expression and timezone settings

### Logs

Check the application logs for detailed error information:

```bash
# View recent logs
tail -f src/logs/app-$(date +%Y-%m-%d).log
```

## Development

### Project Structure

```
src/
├── app.ts                 # Main Hono application
├── index.ts              # Server entry point
├── db/                   # Database configuration
│   ├── database.ts       # Drizzle setup
│   └── schema/           # Database schemas
├── lib/                  # Shared utilities
│   ├── env.ts           # Environment validation
│   ├── logger.ts        # Logging configuration
│   ├── queue.ts         # BullMQ queue setup
│   └── redis.ts         # Redis connection
├── middleware/           # Express middleware
├── routes/              # API routes
├── scheduler/           # Cron scheduler
└── worker/              # BullMQ workers
```

### Adding New Features

1. **New API Endpoints**: Add to `src/routes/`
2. **New Job Types**: Extend worker in `src/worker/`
3. **New Schedules**: Add to `src/scheduler/`
4. **Database Changes**: Update schema and run migrations

## License

MIT
