import OpenAI from "openai";
import dotenv from 'dotenv';
import { GeneralPrompt, GradeLevelPrompt, SubjectPrompt, LessonLengthPrompt } from './GPTPrompt.js';

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
    async *GPTstreamingRequest(message, gradeLevel, subject, timeLength) {
        const messages = this.generatePromptMessages(message, gradeLevel, subject, timeLength);
        const stream = await openai.chat.completions.create({
            model: GPTmodel,
            messages: messages,
            max_tokens: 500, // if the user has a message over 500 tokens they should be cut off
            store: true, // By setting store to true, we can later tweak our model based on the feedback we receive
            stream: true,
            metadata: {
                GradeLevelPrompt: gradeLevel,
                SubjectPrompt: subject,
                LessonLength: timeLength,
            },
        });
        for await (const chunk of stream) {
            yield chunk.choices[0]?.delta?.content || "";
        }
    },

    generatePromptMessages(message, gradeLevel, subject, timeLength) {
        const messages = [];
        messages.push({ role: "system", content: GeneralPrompt });
        if (gradeLevel) {
            messages.push({ role: "system", content: GradeLevelPrompt(gradeLevel) });
        }
        if (subject) {
            messages.push({ role: "system", content: SubjectPrompt(subject) });
        }
        if (timeLength) {
            messages.push({ role: "system", content: LessonLengthPrompt(timeLength) });
        }
        messages.push({ role: "user", content: message });
        return messages;
    }
};

export default ChatGPTConnector;
