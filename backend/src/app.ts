import express from 'express';
import { promises as fs } from 'fs';
import { connectDB } from './database/db';
import specialistsRoutes from './routes/specialistsRoutes';
import categoriesRoutes from './routes/categoriesRoutes';
import authRoutes from './routes/authRoutes';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

// Добавляем CORS middleware
app.use(cors({
  origin: 'http://localhost:5173', // URL фронтенда
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use(express.json());

app.use('/api/specialists', specialistsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'The server is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/avatars/:filename', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/uploads/avatars', req.params.filename));
});

const startServer = async () => {
  try {
    await connectDB();

     const defaultAvatarPath = path.join(__dirname, '../public/uploads/avatars/default.jpg');
    try {
      await fs.access(defaultAvatarPath);
    } catch {
      // Можно добавить создание дефолтной аватарки или использовать placeholder
      console.log('Create a file default.jpg in the folder public/uploads/avatars/');
    }
    
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
      console.log(`File uploads are available via multipart/form-data`);
      console.log(`   • POST /register - register a new user`);
      console.log(`   • POST /login - login a user`);
      console.log(`   • POST /refresh - refresh access token`);
      console.log(`   • GET /me - get current user`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();