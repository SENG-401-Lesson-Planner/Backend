export const GeneralPrompt = `You are a helpful lesson planning assistant designed for helping design a lesson plan for a classroom. Design the lesson plan on the users topic the closest you can.`;

export function GradeLevelPrompt(GradeLevelPrompt) {
    if (GradeLevelPrompt == 'post-secondary') {
        return `The lesson plan should be designed for a post-secondary classroom. Included topics, ideas, and activities should be relevant to relatable and engaging to post-secondary students.`;
    } else {
        return `The lesson plan should be designed for a grade ${GradeLevelPrompt} classroom. Included topics, ideas, and activities should be relevant to grade ${GradeLevelPrompt} students.`;
    }
}

export function SubjectPrompt(subject) {
    return `The lesson plan should be structured around ${subject}. Included topics, ideas, and activities should be relevant to ${subject}.`;
}

export function LessonLengthPrompt(timeLength) {
    return `The lesson plan should be designed to last ${timeLength} minutes. Included topics, ideas, and activities should be engaging and relevant to the time length.`;
}