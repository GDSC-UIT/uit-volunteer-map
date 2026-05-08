import app from './app.js';
import { AppDataSource } from './db/data-source.js';
import { imageRouter } from './routes/image.js';

// Register routes
app.use('/api/images', imageRouter);  

import express from 'express';
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const PORT = process.env.PORT || 5000;

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((error: Error) => {
    console.error('Error connecting to database:', error);
    process.exit(1);
  });

export default app;
