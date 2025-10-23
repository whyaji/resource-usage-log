// Define common environment variables for production
const env_production = {
  NODE_ENV: 'production',
  LOG_LEVEL: 'info',
  DB_HOST: 'localhost',
  DB_PORT: 3306,
  DB_USER: 'your-db-user',
  DB_PASSWORD: 'your-db-password',
  DB_NAME: 'your-db-name',
  APP_API_KEY: 'your-app-api-key',
  REDIS_HOST: 'localhost',
  REDIS_PORT: 6379,
  REDIS_PASSWORD: 'your-redis-password',
};

module.exports = {
  apps: [
    {
      name: 'resource-status-api',
      script: 'dist/src/index.js',
      env: env_production,
      instances: 1,
      exec_mode: 'fork', // use 'cluster' if you want multiple instances
      error_file: './logs/pm2-api-error.log',
      out_file: './logs/pm2-api-out.log',
      log_file: './logs/pm2-api-combined.log',
      time: true,
      max_memory_restart: '500M', // auto-restart if memory exceeds 500MB
      restart_delay: 5000, // wait 5s before restarting after crash
    },
    {
      name: 'resource-status-worker',
      script: 'dist/src/worker/index.js',
      env: env_production,
      instances: 1,
      exec_mode: 'fork',
      error_file: './logs/pm2-worker-error.log',
      out_file: './logs/pm2-worker-out.log',
      log_file: './logs/pm2-worker-combined.log',
      time: true,
      max_memory_restart: '300M',
      restart_delay: 5000,
    },
    {
      name: 'resource-status-scheduler',
      script: 'dist/src/scheduler/index.js',
      env: env_production,
      instances: 1,
      exec_mode: 'fork',
      error_file: './logs/pm2-scheduler-error.log',
      out_file: './logs/pm2-scheduler-out.log',
      log_file: './logs/pm2-scheduler-combined.log',
      time: true,
      max_memory_restart: '300M',
      restart_delay: 5000,
    },
  ],
};
