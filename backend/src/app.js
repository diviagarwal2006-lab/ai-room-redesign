import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import healthRoutes from './routes/health.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: config.frontendUrls }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/health', healthRoutes);

// These two MUST stay last
app.use(notFoundHandler);
app.use(errorHandler);

export default app;