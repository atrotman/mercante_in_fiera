import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initializeSocket } from './socket/socket';
import gameRoutes from './routes/gameRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const httpServer = createServer(app);
const io = initializeSocket(httpServer);

app.use(cors());
app.use(express.json());

// Attach io to request for use in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/games', gameRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 