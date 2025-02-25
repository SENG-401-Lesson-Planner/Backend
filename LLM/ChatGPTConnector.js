import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();

const openapi_orgID = process.env.OPENAPI_ORGID;
const openapi_projectID = process.env.OPENAPI_PROJECTID;
const openapi_apiKey = process.env.OPENAPI_APIKEY;

const openai = new OpenAI({
    organization: openapi_orgID,
    project: openapi_projectID,
    apiKey: openapi_apiKey,
});

const ChatGPTConnector = {
    async GPTstreamingRequest(message, model) {
        const stream = await openai.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: message }],
            store: true,
            stream: true,
        });
        for await (const chunk of stream) {
            return chunk.choices[0]?.delta?.content || "";
        }
    }
};

export default ChatGPTConnector;
