import express from 'express';


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); 

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'The server is running!', 
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`The server is running on port ${PORT}`);
  console.log(`Check: http://localhost:${PORT}/api/health`);
});