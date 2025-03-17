export function appendPreprompt(message, GradeLevelPrompt, SubjectPrompt) {
    if (GradeLevelPrompt == 'post-secondary') {
        GPTPrompt = `You are a helpful lesson planning assistant designed for helping design a lesson plan for a grade post-secondary classroom. Design the lesson plan on the topic of ${message} the closest you can.`;
    } else {
        GPTPrompt = `You are a helpful lesson planning assistant designed for helping design a lesson plan for a grade ${GradeLevelPrompt} classroom. Design the lesson plan on the topic of ${message} the closest you can.`;
    }
    if (SubjectPrompt != null) {
        GPTPrompt = GPTPrompt + ` The lesson plan should be for the subject of ${SubjectPrompt}.`;
    }
    return GPTPrompt;
}