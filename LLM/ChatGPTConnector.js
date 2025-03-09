import OpenAI from "openai";
import dotenv from 'dotenv';
import GPTPreprompt from './GPTPreprompt.js';

dotenv.config();

const openapi_orgID = process.env.OPENAPI_ORGID;
const openapi_projectID = process.env.OPENAPI_PROJECTID;
const openapi_apiKey = process.env.OPENAPI_APIKEY;
const GPTmodel = "gpt-4o-mini";

const openai = new OpenAI({
    organization: openapi_orgID,
    project: openapi_projectID,
    apiKey: openapi_apiKey,
});

const ChatGPTConnector = {
    async *GPTstreamingRequest(message, GradeLevel) {
        const stream = await openai.chat.completions.create({
            model: GPTmodel,
            messages: [{ role: "system", content: GPTPreprompt[GradeLevel]}, { role: "user", content: message }],
            store: true, // By setting store to true, we can later tweak our model based on the feedback we receive
            stream: true,
            metadata: {
                GradeLevelPrompt: GradeLevel,
            },
        });
        for await (const chunk of stream) {
            yield chunk.choices[0]?.delta?.content || "";
        }
    }
};

export default ChatGPTConnector;
