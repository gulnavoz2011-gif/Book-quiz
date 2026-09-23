import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export interface BookAnalysisResult {
  title: string;
  detectedAuthor?: string;
  summary: string;
  chaptersOrSections: string[];
  keyTopics: string[];
  importantConcepts: string[];
  charactersOrEntities: string[];
  totalEstimatedTokens?: number;
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[]; // 4 options for multiple_choice, ['True', 'False'] for true_false
  correctAnswer: string;
  explanation: string;
  sourceContext: string; // quote or passage reference from the book
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface QuizGenerationOptions {
  numberOfQuestions: number; // 5, 10, 20, 30, 50
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionTypes: ('multiple_choice' | 'true_false' | 'short_answer')[];
  bookTitle?: string;
  language?: 'uz' | 'en';
}

/**
 * Resilient Gemini caller that retries across models if 503 / high demand occurs
 */
async function generateWithModelFallback(
  prompt: string,
  temperature = 0.2
): Promise<string> {
  const ai = getGeminiClient();
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature,
        },
      });

      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying next fallback:`, err?.message || err);
      lastError = err;
      // Short delay before trying next model
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  throw lastError || new Error('All AI models are currently unavailable. Please try again.');
}

/**
 * Splits text into manageable chunks so we don't overwhelm token limits
 * while maintaining paragraph/chapter coherence.
 */
export function chunkBookText(text: string, maxChunkLength = 6000): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if ((currentChunk + '\n\n' + trimmed).length > maxChunkLength) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = trimmed;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmed}` : trimmed;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text.slice(0, maxChunkLength)];
}

/**
 * Analyze the extracted book text to detect title, chapters, topics, concepts, etc.
 */
export async function analyzeBookContent(
  fullText: string,
  fileName: string
): Promise<BookAnalysisResult> {
  const textLength = fullText.length;
  let sampleText = '';

  if (textLength <= 18000) {
    sampleText = fullText;
  } else {
    const head = fullText.slice(0, 8000);
    const midStart = Math.floor(textLength / 2) - 3000;
    const mid = fullText.slice(midStart, midStart + 6000);
    const tail = fullText.slice(-4000);
    sampleText = `[BEGINNING OF BOOK]\n${head}\n\n[SAMPLE FROM MIDDLE SECTION]\n${mid}\n\n[SAMPLE FROM END SECTION]\n${tail}`;
  }

  const prompt = `You are an expert literary and academic analyst for BookQuiz AI.
Analyze the following text extracted from an uploaded book (Original filename: "${fileName}").

TASK:
1. Detect or infer the most accurate Book Title (or use the document topic if it's an educational paper/handbook).
2. Detect author if mentioned, otherwise leave blank or "Unknown".
3. Write a concise 2-3 sentence summary of the book/document.
4. List the key chapters, sections, or major structural themes found in the text.
5. Identify 5-8 key topics covered.
6. Identify 5-8 important concepts or definitions.
7. Identify notable characters, key figures, or primary entities mentioned in the book.

CRITICAL RULES:
- Base EVERYTHING strictly on the text provided below.
- Do NOT fabricate or hallucinate any outside knowledge.

TEXT SAMPLE:
---
${sampleText}
---

Respond ONLY in valid JSON conforming to this schema:
{
  "title": "string",
  "detectedAuthor": "string",
  "summary": "string",
  "chaptersOrSections": ["string"],
  "keyTopics": ["string"],
  "importantConcepts": ["string"],
  "charactersOrEntities": ["string"]
}`;

  try {
    const responseText = await generateWithModelFallback(prompt, 0.2);
    const parsed = JSON.parse(responseText);
    return {
      title: parsed.title || fileName.replace(/\.pdf$/i, ''),
      detectedAuthor: parsed.detectedAuthor || undefined,
      summary: parsed.summary || 'Educational book material ready for quiz generation.',
      chaptersOrSections: Array.isArray(parsed.chaptersOrSections) ? parsed.chaptersOrSections : ['Introduction', 'Core Chapters', 'Summary'],
      keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : ['Core Material'],
      importantConcepts: Array.isArray(parsed.importantConcepts) ? parsed.importantConcepts : ['Key Principles'],
      charactersOrEntities: Array.isArray(parsed.charactersOrEntities) ? parsed.charactersOrEntities : [],
    };
  } catch (err) {
    console.error('Book analysis error (using rule-based fallback):', err);
    // Fallback extraction
    const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
    const titleCandidate = lines[0] ? lines[0].slice(0, 60) : fileName.replace(/\.pdf$/i, '');
    return {
      title: titleCandidate,
      summary: `Uploaded document "${fileName}" with ${Math.round(fullText.length / 5)} estimated words analyzed for testing.`,
      chaptersOrSections: ['Part 1: Fundamentals', 'Part 2: Applications', 'Part 3: Conclusions'],
      keyTopics: ['Core Principles', 'Definitions', 'Key Themes'],
      importantConcepts: ['Primary Concepts', 'Methodology'],
      charactersOrEntities: [],
    };
  }
}

/**
 * Generate high-quality grounded quiz questions strictly from the book content chunks.
 */
export async function generateQuizQuestions(
  fullText: string,
  options: QuizGenerationOptions
): Promise<GeneratedQuestion[]> {
  const { numberOfQuestions, difficulty, questionTypes } = options;

  // Split book into chunks to distribute question coverage across the entire book
  const chunks = chunkBookText(fullText, 7000);
  const numChunks = chunks.length;

  const maxSamples = Math.min(numChunks, Math.max(3, Math.ceil(numberOfQuestions / 2)));
  const step = numChunks / maxSamples;
  const selectedExcerpts: string[] = [];

  for (let i = 0; i < maxSamples; i++) {
    const chunkIndex = Math.min(numChunks - 1, Math.floor(i * step));
    selectedExcerpts.push(`[EXCERPT SECTION ${i + 1} OF ${maxSamples}]:\n${chunks[chunkIndex]}`);
  }

  const combinedExcerpts = selectedExcerpts.join('\n\n====================\n\n');

  const typesDescription = questionTypes.map(t => {
    if (t === 'multiple_choice') return 'multiple_choice (must provide exactly 4 distinct options in "options", with exactly 1 correct answer in "correctAnswer")';
    if (t === 'true_false') return 'true_false ("options" must be ["True", "False"], "correctAnswer" must be "True" or "False")';
    if (t === 'short_answer') return 'short_answer ("options" should be null or omitted, "correctAnswer" is the concise factual model answer)';
    return t;
  }).join('; ');

  const langRequirement = options.language === 'uz'
    ? 'All questions, options, explanations, and context references must be written fluently in Uzbek (O\'zbek tili, Lotin yozuvida).'
    : options.language === 'en'
    ? 'All questions, options, explanations, and context references must be written fluently in English.'
    : 'Generate questions, options, and explanations in the primary language of the book (Uzbek if Uzbek, English if English).';

  const prompt = `You are the lead academic assessment engine for BookQuiz AI.
Your goal is to generate ${numberOfQuestions} rigorous, unambiguous, and educational quiz questions based EXCLUSIVELY on the book excerpts provided below.

LANGUAGE REQUIREMENT:
- ${langRequirement}

PARAMETERS:
- Number of Questions: ${numberOfQuestions}
- Difficulty Level: ${difficulty} (If "mixed", distribute across easy, medium, and hard)
- Allowed Question Types: ${typesDescription}
- Book Title: ${options.bookTitle || 'Uploaded Book'}

STRICT ANTI-HALLUCINATION RULES:
1. The provided book excerpts are the SOLE source of truth.
2. Every question, option, correct answer, and explanation must be directly provable from the excerpts below.
3. NEVER assume, invent, or bring in outside external knowledge that does not appear in the text.
4. Correct answers must be completely unambiguous and factual according to the text.
5. In the "explanation" field, explicitly cite how the book explains the answer.
6. In "sourceContext", provide a brief 1-2 sentence verbatim quote or precise excerpt reference from the text supporting this question.
7. Distribute questions across different sections of the excerpts.
8. Ensure multiple choice distractors are plausible within the context of the book, but factually incorrect according to the book's specific claims.
9. Avoid duplicate or overlapping questions.

EXCERPTS FROM THE BOOK:
------------------------------------
${combinedExcerpts}
------------------------------------

OUTPUT FORMAT:
Respond with ONLY valid JSON array containing exactly ${numberOfQuestions} question objects:
[
  {
    "id": "q1",
    "question": "Clear, direct question text",
    "type": "multiple_choice" | "true_false" | "short_answer",
    "options": ["Option A", "Option B", "Option C", "Option D"], // or ["True", "False"] for true_false, or omit for short_answer
    "correctAnswer": "Exact correct option string or factual short answer",
    "explanation": "The book explains that ...",
    "sourceContext": "Relevant excerpt sentence from the text",
    "difficulty": "easy" | "medium" | "hard",
    "topic": "Concept or chapter topic"
  }
]`;

  try {
    const responseText = await generateWithModelFallback(prompt, 0.25);
    const rawQuestions = JSON.parse(responseText);
    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      throw new Error('Response is not a valid array of questions');
    }

    const validatedQuestions: GeneratedQuestion[] = rawQuestions.map((q, idx) => {
      let type: 'multiple_choice' | 'true_false' | 'short_answer' = 'multiple_choice';
      if (q.type === 'true_false' || q.type === 'short_answer' || q.type === 'multiple_choice') {
        type = q.type;
      } else if (Array.isArray(q.options) && q.options.length === 2 && q.options.includes('True')) {
        type = 'true_false';
      }

      let options = q.options;
      if (type === 'true_false') {
        options = ['True', 'False'];
      } else if (type === 'multiple_choice' && (!Array.isArray(options) || options.length < 2)) {
        options = [q.correctAnswer, 'Alternative interpretation A', 'Alternative interpretation B', 'None of the above'];
      } else if (type === 'short_answer') {
        options = undefined;
      }

      return {
        id: q.id || `q_${idx + 1}_${Date.now()}`,
        question: q.question || `Question ${idx + 1}`,
        type,
        options,
        correctAnswer: String(q.correctAnswer || '').trim(),
        explanation: q.explanation || 'The book explains this in the text context.',
        sourceContext: q.sourceContext || 'Referenced from uploaded document.',
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : (difficulty === 'mixed' ? 'medium' : difficulty),
        topic: q.topic || 'General',
      };
    });

    return validatedQuestions;
  } catch (err) {
    console.error('AI question generation error, building book-grounded fallback questions:', err);
    return buildGroundedFallbackQuestions(fullText, options);
  }
}

/**
 * Robust text-grounded generator if upstream AI service is temporarily unavailable
 */
function buildGroundedFallbackQuestions(
  fullText: string,
  options: QuizGenerationOptions
): GeneratedQuestion[] {
  const { numberOfQuestions, difficulty, questionTypes } = options;
  const questions: GeneratedQuestion[] = [];

  // Extract meaningful declarative sentences from the book
  const sentences = fullText
    .split(/[.!?]+\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 160 && !s.includes('\n'));

  const typesToUse = questionTypes.length > 0 ? questionTypes : (['multiple_choice', 'true_false'] as const);

  for (let i = 0; i < numberOfQuestions; i++) {
    const type = typesToUse[i % typesToUse.length];
    const sentenceIndex = Math.min(sentences.length - 1, Math.floor((i / numberOfQuestions) * sentences.length));
    const sentence = sentences[sentenceIndex] || `Key principle ${i + 1} described in the uploaded book.`;

    const qDiff = difficulty === 'mixed' ? (['easy', 'medium', 'hard'][i % 3] as 'easy' | 'medium' | 'hard') : difficulty;

    if (type === 'true_false') {
      const isTrue = i % 2 === 0;
      questions.push({
        id: `q_fb_${i + 1}`,
        question: isTrue
          ? `According to the book: "${sentence}"`
          : `True or False: The text contradicts that "${sentence.slice(0, 70)}..."`,
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswer: isTrue ? 'True' : 'False',
        explanation: `The book explicitly describes this fact: "${sentence}".`,
        sourceContext: sentence,
        difficulty: qDiff,
        topic: 'Document Content',
      });
    } else if (type === 'short_answer') {
      questions.push({
        id: `q_fb_${i + 1}`,
        question: `Based on the book, explain the significance of: "${sentence.slice(0, 80)}..."`,
        type: 'short_answer',
        correctAnswer: sentence,
        explanation: `The book explains: "${sentence}".`,
        sourceContext: sentence,
        difficulty: qDiff,
        topic: 'Document Content',
      });
    } else {
      // Multiple choice
      const optionsArr = [
        sentence,
        `An alternative claim not substantiated by the author`,
        `The exact opposite of the conclusion presented in the text`,
        `A secondary viewpoint refuted by the document`,
      ];
      // Shuffle options deterministically
      const shuffled = [...optionsArr].sort(() => 0.5 - Math.random());

      questions.push({
        id: `q_fb_${i + 1}`,
        question: `Which of the following statements is directly affirmed by the book?`,
        type: 'multiple_choice',
        options: shuffled,
        correctAnswer: sentence,
        explanation: `The book explains: "${sentence}".`,
        sourceContext: sentence,
        difficulty: qDiff,
        topic: 'Document Content',
      });
    }
  }

  return questions;
}

export interface ShortAnswerEvaluation {
  isCorrect: boolean;
  score: number; // 0 or 1
  feedback: string;
}

/**
 * Semantically evaluates a short answer against model answer and book context.
 */
export async function evaluateShortAnswer(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  sourceContext: string
): Promise<ShortAnswerEvaluation> {
  const trimmedUser = userAnswer.trim();
  if (!trimmedUser) {
    return {
      isCorrect: false,
      score: 0,
      feedback: 'No answer provided.',
    };
  }

  const normUser = trimmedUser.toLowerCase().replace(/[^\w\s]/g, '');
  const normCorrect = correctAnswer.toLowerCase().replace(/[^\w\s]/g, '');

  // Exact or containment match
  if (normUser === normCorrect || normCorrect.includes(normUser) || normUser.includes(normCorrect)) {
    return {
      isCorrect: true,
      score: 1,
      feedback: 'Strong alignment with the book explanation.',
    };
  }

  try {
    const prompt = `You are evaluating a student's answer for BookQuiz AI.
Judge whether the student's short answer is factually correct according to the question, the reference model answer, and the book context.

QUESTION: "${question}"
BOOK CONTEXT: "${sourceContext}"
REFERENCE CORRECT ANSWER: "${correctAnswer}"
STUDENT'S ANSWER: "${userAnswer}"

EVALUATION RULES:
1. Accept equivalent wording, synonyms, and paraphrasing if the essential meaning and core fact are correct.
2. Minor spelling or grammatical errors should NOT penalize the student if the concept is evident.
3. If the student provides contrary information, a wrong entity, or fundamentally incorrect facts, mark it incorrect.
4. Provide a 1-sentence supportive explanation of your assessment.

Respond with ONLY valid JSON:
{
  "isCorrect": true | false,
  "feedback": "1 sentence explaining why this is accepted or what was missing."
}`;

    const responseText = await generateWithModelFallback(prompt, 0.1);
    const parsed = JSON.parse(responseText);
    return {
      isCorrect: Boolean(parsed.isCorrect),
      score: parsed.isCorrect ? 1 : 0,
      feedback: parsed.feedback || (parsed.isCorrect ? "Kitob tushunchasiga to'liq mos keladi." : "Kitobdagi asosiy faktlar bilan mos kelmadi."),
    };
  } catch (err: any) {
    console.error('Semantic evaluation error details:', err?.message || err);
    // Word overlap fallback
    const userWords = new Set(normUser.split(/\s+/));
    const correctWords = normCorrect.split(/\s+/).filter(w => w.length > 3);
    const matches = correctWords.filter(w => userWords.has(w));
    const isClose = matches.length >= Math.min(2, correctWords.length);

    return {
      isCorrect: isClose,
      score: isClose ? 1 : 0,
      feedback: isClose ? "Kitobdagi asosiy tushunchalarni to'g'ri ifodalagan." : "Kitobdagi muhim faktlar yetishmayapti.",
    };
  }
}
