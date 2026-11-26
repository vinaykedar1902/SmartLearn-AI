const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash-lite';

// ============================================
// COMMON AI FUNCTION
// ============================================
async function callAI(prompt, maxTokens = 2048) {
  if (!API_KEY) {
    throw new Error('OpenRouter API key is missing. Please check your .env file.');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'SmartLearn AI'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || `API request failed: ${response.status}`
      );
    }

    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      throw new Error('No valid response received from AI.');
    }

    return result;
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw error;
  }
}

// ==========================================
// HELPER: PARSE AI JSON RESPONSE
// ==========================================

function parseJSON(response) {
  try {
    const cleaned = response
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const start = cleaned.search(/[\[{]/);

    if (start === -1) {
      throw new Error('No JSON data found in AI response.');
    }

    const jsonText = cleaned.slice(start);
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('JSON parsing error:', error);
    throw new Error('AI returned an invalid format. Please try again.');
  }
}

// ==========================================
// 1. GENERATE AI SUMMARY
// ==========================================

export async function generateSummary(text) {
  if (!text?.trim()) {
    throw new Error('Please upload a PDF first.');
  }

  const prompt = `
You are an expert academic assistant.

Analyze the study material and generate:

1. Chapter Overview
2. Key Concepts
3. Important Definitions
4. Important Exam Topics
5. Quick Revision Points

Use simple language, headings and bullet points.
Focus on examination preparation.

Return structured Markdown.

Study Material:
${text}
`;

  return await callAI(prompt, 4096);
}

// ==========================================
// 2. GENERATE REVISION NOTES
// ==========================================

export async function generateRevisionNotes(text) {
  if (!text?.trim()) {
    throw new Error('Please upload a PDF first.');
  }

  const prompt = `
You are an expert academic tutor.

Create concise revision notes from the following study material.

Include:
1. Important concepts
2. Definitions
3. Key formulas
4. Important points
5. Differences and comparisons
6. Exam-focused revision points

Use simple language, headings and bullet points.
Do not introduce information unrelated to the material.

Return structured Markdown.

Study Material:
${text}
`;

  return await callAI(prompt, 2048);
}

// ==========================================
// 3. GENERATE QUIZ
// ==========================================

export async function generateQuiz(
  text,
  questionCount = 10,
  difficulty = 'Medium',
  topic = 'All Topics'
) {
  if (!text?.trim()) {
    throw new Error('Please upload a PDF first.');
  }

  const prompt = `
Generate exactly ${questionCount} multiple-choice questions
from the study material.

Difficulty: ${difficulty}
Topic: ${topic}

Return ONLY a valid JSON array.
Do not include Markdown or explanations outside JSON.

Required format:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Explanation of the correct answer"
  }
]

Ensure correctAnswer exactly matches one of the options.
Generate exactly ${questionCount} questions.

Study Material:
${text}
`;

  const result = await callAI(prompt, 2048);
  const quiz = parseJSON(result);

  if (!Array.isArray(quiz)) {
    throw new Error('Invalid quiz format received from AI.');
  }

  return quiz;
}

// ==========================================
// 4. GENERATE IMPORTANT TOPICS
// ==========================================

export async function generateTopics(text) {
  if (!text?.trim()) {
    throw new Error('Please upload a PDF first.');
  }

  const prompt = `
Analyze the study material and identify the 10-15
most important topics for examination preparation.

Return ONLY a valid JSON array of topic names.

Example:
[
  "Topic 1",
  "Topic 2",
  "Topic 3"
]

Do not include Markdown or additional text.

Study Material:
${text}
`;

  const result = await callAI(prompt, 2048);
  const topics = parseJSON(result);

  if (!Array.isArray(topics)) {
    throw new Error('Invalid topics format received from AI.');
  }

  return topics;
}

// ==========================================
// 5. GENERATE EXAM QUESTIONS
// ==========================================

export async function generateExamQuestions(
  text,
  questionType = 'All Types',
  count = 10,
  topic = 'All Topics'
) {
  if (!text?.trim()) {
    throw new Error('Please upload a PDF first.');
  }

  const prompt = `
You are an experienced university examiner.

Generate exactly ${count} examination questions
based on the provided study material.

Question Type: ${questionType}
Topic: ${topic}

Return ONLY a valid JSON array.

Required format:
[
  {
    "question": "Write the examination question here",
    "answer": "Detailed model answer",
    "keyPoints": [
      "Important point 1",
      "Important point 2",
      "Important point 3"
    ]
  }
]

Answers should be accurate, clear and suitable
for university examinations.

Do not include Markdown outside JSON.

Study Material:
${text}
`;

  const result = await callAI(prompt, 4096);
  const questions = parseJSON(result);

  if (!Array.isArray(questions)) {
    throw new Error('Invalid exam questions format received from AI.');
  }

  return questions;
}

// ==========================================
// 6. GENERATE VIVA QUESTIONS
// ==========================================

export async function generateVivaQuestions(
  text,
  count = 10,
  difficulty = 'Medium',
  topic = 'All Topics'
) {
  if (!text?.trim()) {
    throw new Error('Please upload a PDF first.');
  }

  const prompt = `
You are an experienced technical interviewer and viva examiner.

Generate exactly ${count} viva questions
from the provided study material.

Difficulty: ${difficulty}
Topic: ${topic}

Return ONLY a valid JSON array.

Required format:
[
  {
    "question": "Viva question",
    "answer": "Clear and understandable answer",
    "difficulty": "Easy",
    "keyPoints": [
      "Key point 1",
      "Key point 2"
    ],
    "followUpQuestion": "A related follow-up question"
  }
]

Use a suitable difficulty value for each question.
Answers should be technically accurate.

Do not include Markdown outside JSON.

Study Material:
${text}
`;

  const result = await callAI(prompt, 4096);
  const questions = parseJSON(result);

  if (!Array.isArray(questions)) {
    throw new Error('Invalid viva questions format received from AI.');
  }

  return questions;
}

// ==========================================
// 7. TEST AI CONNECTION
// ==========================================

export async function testAI() {
  const prompt = `
Reply with:
"SmartLearn AI connection successful!"
`;

  return await callAI(prompt, 100);
}

// Backward compatibility with the previous function name
export async function testAPI() {
  return await testAI();
}

// Backward compatibility with the previous sample question function
export async function generateSampleQuestions(text) {
  return await generateExamQuestions(text, 'All Types', 20, 'All Topics');
}
``