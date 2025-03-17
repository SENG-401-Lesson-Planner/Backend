import express from 'express';
import ChatGPTConnector from './LLM/ChatGPTConnector.js';
import DatabaseConnector from './Database/DatabaseConnector.js';
import { appendPreprompt } from './LLM/GPTPrompt.js';

const app = express();
const port = 3000;
DatabaseConnector.connectToDatabase();

app.use(express.json());

// Endpoint for handling chat requests to the GPT model
// Input: { message: string, GradeLevelPrompt: string, SubjectPrompt: string } in the body, authentication token in the headers
// Output: Streamed response from the GPT model
app.post('/LLM/chat', async (req, res) => {
    const { message, GradeLevelPrompt, SubjectPrompt } = req.body;
    const { authentication } = req.headers; 
    if (!message || !GradeLevelPrompt) {
        res.status(400).send('No message prompt provided');
        return;
    }

    // appends the specified preprompts to the message
    message = appendPreprompt(message, GradeLevelPrompt, SubjectPrompt);

    let completeResponse = '';
    res.setHeader('Content-Type', 'text/plain');
    
    for await (const stream of ChatGPTConnector.GPTstreamingRequest(message, GradeLevelPrompt)) {
        res.write(stream);
        completeResponse += stream;
    }
    
    res.end();

    if (authentication) {
        DatabaseConnector.verifyToken(authentication, (err, decoded) => {
            if (err) {
                return;
            }
            DatabaseConnector.addResponseToDatabase(decoded.username, completeResponse, (err, results) => {
                if (err) {
                    return;
                }
            });
        });
    }

});

// Endpoint for registering a new user
// Input: { username: string, password: string } in the body
// Output: Access token if registration is successful
app.post('/account/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).send('Username or password not provided');
        return;
    }
    
    if (username.length < 4 || password.length < 4) {
        res.status(400).send('Username and password must be at least 4 characters long');
        return;
    } else if (username.length > 20 || password.length > 20) {
        res.status(400).send('Username and password must be at most 20 characters long');
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

// Endpoint for logging in a user
// Input: { username: string, password: string } in the body
// Output: Access token if login is successful
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

// Endpoint for getting the response history of a user
// Input: Authentication token in the headers
// Output: Response history of the user
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

// Endpoint for adding a response to the user's response history
// Input: { response: string } in the body, authentication token in the headers
// Output: Success message if response is added successfully
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

// Endpoint for removing a response from the user's response history
// Input: { response: string } in the body, authentication token in the headers
// Output: Success message if response is removed successfully
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

// Endpoint for checking if a user is logged in
// Input: Authentication token in the headers
// Output: Username if the user is logged in
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