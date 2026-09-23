require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/letters', require('./routes/letters'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/risks', require('./routes/risks'));
app.use('/api/evidence', require('./routes/evidence'));
app.use('/api/members', require('./routes/members'));
app.use('/api/audit-logs', require('./routes/audit'));

app.get('/api/constants', (req, res) => res.json(require('./config/constants')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
