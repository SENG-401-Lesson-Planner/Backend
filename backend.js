import express from 'express';
import ChatGPTConnector from './LLM/ChatGPTConnector.js';
import DatabaseConnector from './Database/DatabaseConnector.js';

const app = express();
const port = 3000;
const GPTmodel = "gpt-4o-mini";
DatabaseConnector.connectToDatabase();

app.use(express.json());

// ALL GPT ENDPOINTS
app.post('/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        res.status(400).send('No message provided');
        return;
    }
    const model = GPTmodel;
    const stream = await ChatGPTConnector.GPTstreamingRequest(message, model);
    res.send(stream);
});

// ALL DATABASE AND ACCOUNT ENDPOINTS
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).send('Username or password not provided');
        return;
    }
    DatabaseConnector.addNewUserToDatabase(username, password, (err, access_token) => {
        if (err) {
            res.status(500).send(`Error registering user ${username}`);
            return;
        }
        console.log(`User "${username}" registered successfully.`);
        res.send(access_token);
    });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).send('Username or password not provided');
        return;
    }
    DatabaseConnector.loginToDatabase(username, password, (err, access_token) => {
        if (err) {
            res.status(500).send('Error logging in');
            return;
        } else if (access_token === null) {
            res.status(401).send('Invalid username or password');
            return;
        }
        console.log(`User "${username}" logged in successfully.`);
        res.send(access_token)
    });
});

app.get('/responsehistory', async (req, res) => {
    const { authentication } = req.headers;
    if (!authentication) {
        res.status(400).send('No authentication token provided');
        return;
    }
    DatabaseConnector.verifyToken(authentication, (err, decoded) => {
        if (err) {
            res.status(401).send('Invalid token');
            return;
        }
        const username = decoded.username;
        DatabaseConnector.getReponseHistoryFromUser(username, (err, results) => {
            if (err) {
                res.status(500).send('Error getting chat history');
                return;
            }
            res.send(results);
        });
    });
});

app.post('/response', async (req, res) => {
    const { authentication } = req.headers;
    console.log(req.headers);
    const { response } = req.body;
    if (!authentication) {
        res.status(400).send('No authentication token provided');
        return;
    }
    DatabaseConnector.verifyToken(authentication, (err, decoded) => {
        if (err) {
            res.status(401).send('Invalid token');
            return;
        }
        const username = decoded.username;
        DatabaseConnector.addResponseToDatabase(username, response, (err, results) => {
            if (err) {
                res.status(500).send('Error adding response');
                return;
            }
            res.send('Response added successfully');
        });
    });
}); 

app.post('/isloggedin', async (req, res) => {
    const { authentication } = req.headers;
    if (!authentication) {
        res.status(400).send('No authentication token provided');
        return;
    }
    DatabaseConnector.verifyToken(authentication, (err, decoded) => {
        if (err) {
            res.status(401).send('Invalid token');
            return;
        }
        res.send(decoded.username);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});