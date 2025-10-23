import { Hono } from 'hono';

import { apiKeyMiddleware } from './middleware/apiKeyMiddleware.js';
import { resourceUsageRoute } from './routes/resourceUsageRoute.js';

const app = new Hono();

app.basePath('/api').use(apiKeyMiddleware).route('/resource-usage', resourceUsageRoute);

export default app;
