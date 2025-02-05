import express from 'express';
import { GPTstreamingRequest } from './LLM/ChatGPTConnector.js';

const app = express();
const port = 3000;

app.get('/', (_, res) => {
    res.send('Hello World!');
    const stream = GPTstreamingRequest("Hello", "gpt-4o-mini");
    console.log(stream);
});

app.post('/chat', async (req, res) => {
    const { message } = req.body;
    const model = "gpt-4o-mini";
    const stream = await GPTstreamingRequest(message, model);
    res.send(stream);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});