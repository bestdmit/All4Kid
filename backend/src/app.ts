import express from 'express';
import { connectDB } from './database/db';
import specialistsRoutes from './routes/specialistsRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Все запросы к /api/specialists будут обрабатываться specialistsRoutes
app.use('/api/specialists', specialistsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'The server is running!',
    timestamp: new Date().toISOString()
  });
});

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Listening at http://localhost:${PORT}`);
      console.log(`Check health: http://localhost:${PORT}/api/health`);
      console.log(`Specialists API: http://localhost:${PORT}/api/specialists`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();