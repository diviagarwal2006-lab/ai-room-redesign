import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import healthRoutes from './routes/health.js';
import analyzeRoomRoutes from './routes/analyzeRoom.js';
import generateDesignRoutes from './routes/generateDesign.js';
import designRoutes from './routes/design.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: config.frontendUrls }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/health', healthRoutes);
app.use('/api/analyze-room', analyzeRoomRoutes);
app.use('/api/generate-design', generateDesignRoutes);
app.use('/api/design', designRoutes);

// These two MUST stay last
app.use(notFoundHandler);
app.use(errorHandler);

export default app;