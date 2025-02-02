const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

const SECRET_KEY = 'ILoveAlina';

let items = [
    {
        id: 1,
        name: 123,
        description: 123
    }
];
let idCounter = 1;

const users = [
    { id: 1, username: 'admin', password: 'admin', role: 'Admin' },
    { id: 2, username: 'user', password: 'user', role: 'User' }
];

function authenticateToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
}

function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
}

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

// CRUD операції
app.get('/items', (req, res) => {
    res.json(items);
});

app.post('/items', authenticateToken, authorizeRole('User'), (req, res) => {
    const newItem = {
        id: idCounter++,
        name: req.body.name,
        description: req.body.description
    };
    items.push(newItem);
    res.status(201).json(newItem);
});

app.get('/items/:id', (req, res) => {
    const item = items.find(i => i.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
});

app.patch('/items/:id', authenticateToken, authorizeRole('Admin'), (req, res) => {
    const item = items.find(i => i.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (req.body.name) item.name = req.body.name;
    if (req.body.description) item.description = req.body.description;

    res.json(item);
});

app.delete('/items/:id', authenticateToken, authorizeRole('Admin'), (req, res) => {
    const itemIndex = items.findIndex(i => i.id === parseInt(req.params.id));
    if (itemIndex === -1) return res.status(404).json({ message: 'Item not found' });

    items.splice(itemIndex, 1);
    res.status(204).send();
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
