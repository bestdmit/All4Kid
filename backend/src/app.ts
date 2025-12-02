import express from 'express';
import { connectDB } from './database/db';
import specialistsRoutes from './routes/specialistsRoutes';
import categoriesRoutes from './routes/categoriesRoutes'; 
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Добавляем CORS middleware
app.use(cors({
  origin: 'http://localhost:5173', // URL фронтенда
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api/specialists', specialistsRoutes);
app.use('/api/categories', categoriesRoutes); 

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
      console.log(`CORS enabled for: http://localhost:5173`);
      console.log(`Categories API: http://localhost:${PORT}/api/categories`);
      console.log(`Examples:`);
      console.log(`   • Search specialists: http://localhost:${PORT}/api/specialists?search=педиатр`);
      console.log(`   • Filter by category: http://localhost:${PORT}/api/specialists?category=Врачи`);
      console.log(`   • Search and filter: http://localhost:${PORT}/api/specialists?search=детский&category=Врачи`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();