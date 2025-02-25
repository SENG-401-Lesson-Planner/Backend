import express from 'express';
import ChatGPTConnector from './LLM/ChatGPTConnector.js';
import DatabaseConnector from './Database/DatabaseConnector.js';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (_, res) => {
    res.send('Hello World!');
});

app.post('/chat', async (req, res) => {
    const { message } = req.body;
    const model = "gpt-4o-mini";
    const stream = await ChatGPTConnector.GPTstreamingRequest(message, model);
    res.send(stream);
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    DatabaseConnector.addNewUserToDatabase(username, password, (err, results) => {
        if (err) {
            res.status(500).send('Error registering user');
            return;
        }
        res.send('User registered successfully');
    });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    DatabaseConnector.loginToDatabase(username, password, (err, user) => {
        if (err) {
            res.status(500).send('Error logging in');
            return;
        }
        if (!user) {
            res.status(401).send('Invalid username or password');
            return;
        }
        const token = DatabaseConnector.generateToken(user);
        res.send(token);
    });
});

app.get('/responsehistory', async (req, res) => {
    const { jwtToken } = req.body;
    DatabaseConnector.verifyToken(jwtToken, (err, decoded) => {
        if (err) {
            res.status(401).send('Invalid token');
            return;
        }
        const { id } = decoded;
        DatabaseConnector.getChatHistory(id, (err, results) => {
            if (err) {
                res.status(500).send('Error getting chat history');
                return;
            }
            res.send(results);
        });
    });
});

app.post('/response', async (req, res) => {
    const { jwtToken, response } = req.body;
    DatabaseConnector.verifyToken(jwtToken, (err, decoded) => {
        if (err) {
            res.status(401).send('Invalid token');
            return;
        }
        const { id } = decoded;
        DatabaseConnector.addResponseToDatabase(id, response, (err, results) => {
            if (err) {
                res.status(500).send('Error adding response');
                return;
            }
            res.send('Response added successfully');
        });
    });
}); 

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});