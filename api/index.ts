import express from 'express';
import cors from 'cors';
import apiRoutes from './routes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Mount API routes
app.use('/api', apiRoutes);

export default app;

