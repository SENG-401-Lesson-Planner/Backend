import express from 'express';
import ChatGPTConnector from './LLM/ChatGPTConnector.js';
import DatabaseConnector from './Database/DatabaseConnector.js';
import GPTPreprompt from './LLM/GPTPreprompt.js';

const app = express();
const port = 3000;
const GPTmodel = "gpt-4o-mini";
DatabaseConnector.connectToDatabase();

app.use(express.json());

// ALL GPT ENDPOINTS
app.post('/LLM/chat', async (req, res) => {
    const { message, GradeLevelPrompt } = req.body;
    if (!message || !GradeLevelPrompt) {
        res.status(400).send('No message or grade level prompt provided');
        return;
    }
    
    const gptRequestMessage = `${GPTPreprompt[GradeLevelPrompt]} ${message}`; // Add the grade level prompt to the message
    const model = GPTmodel;
    const stream = await ChatGPTConnector.GPTstreamingRequest(gptRequestMessage, model);
    res.send(stream);
});

// ALL DATABASE AND ACCOUNT ENDPOINTS
app.post('/account/register', async (req, res) => {
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
        res.status(200).send(access_token);
    });
});

app.post('/account/login', async (req, res) => {
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
        res.status(200).send(access_token)
    });
});

app.get('/account/responsehistory', async (req, res) => {
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
            res.status(200).send(results);
        });
    });
});

app.post('/account/addresponse', async (req, res) => {
    const { authentication } = req.headers;
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
            res.status(200).send('Response added successfully');
        });
    });
}); 

app.delete('/account/removereponse', async (req, res) => {
    const { authentication } = req.headers;
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
        DatabaseConnector.removeResponseFromDatabase(username, response, (err, results) => {
            if (err) {
                res.status(500).send('Error removing response');
                return;
            }
            res.status(200).send('Response removed successfully');
        });
    });
});

app.post('/account/isloggedin', async (req, res) => {
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
        res.status(200).send(decoded.username);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});