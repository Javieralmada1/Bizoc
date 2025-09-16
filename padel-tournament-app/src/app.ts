import express from 'express';
import bodyParser from 'body-parser';
import tournamentRoutes from './routes/tournaments';
import clubRoutes from './routes/clubs';
import playerRoutes from './routes/players';
import matchRoutes from './routes/matches';
import { authMiddleware } from './middleware/auth';
import { validationMiddleware } from './middleware/validation';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(authMiddleware);
app.use(validationMiddleware);

app.use('/api/tournaments', tournamentRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});