export function appendPreprompt(message, GradeLevelPrompt, SubjectPrompt) {
    if (SubjectPrompt) {
        message = `You are a helpful lesson planning assistant designed for helping design a lesson plan for a grade ${GradeLevelPrompt} classroom. Design the lesson plan for ${SubjectPrompt}.` + message;
        return message
    } else {
        message = `You are a helpful lesson planning assistant designed for helping design a lesson plan for a grade ${GradeLevelPrompt} classroom.` + message;
        return message
    }
}