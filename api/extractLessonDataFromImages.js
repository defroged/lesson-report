// /api/extractLessonDataFromImages.js

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { imageUrls } = req.body;
  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.status(400).json({ error: 'imageUrls is required and should be a non-empty array.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured.' });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

const messages = [
    {
        role: "user",
        content: [
            {
                type: "text",
                text: `Extract the requested data from these images and return ONLY pure JSON. Do not include triple backticks or code blocks. Use this JSON structure:
                {
                    "activities": [],
                    "grammar": [],
                    "phrasesAndSentences": [],
                    "vocabulary": [],
                    "hidden": []
                }
                Follow these instructions:
                
                1. For images of the lesson plan template:
                    - Extract text from the "Lesson Plan" section and populate the "activities" array.
                    - Extract text from the "Grammar" section and populate the "grammar" array.
                    - Extract text from the "Sentences" section and populate the "phrasesAndSentences" array.
                    - Extract text from the "Vocabulary" section and populate the "vocabulary" array.
                    - Extract text from the "Notes" section and populate the "hidden" array. 
                      (This array is exclusively for text from the "Notes" section of the lesson plan.)
                
                2. For other images (e.g., whiteboards, flashcards, worksheets, etc.):
                    - Analyze the content and categorize text appropriately into one or more of the arrays:
                        - Add sentences verbatim from whiteboards to the "phrasesAndSentences" array.
                        - Identify and add studied grammar concepts (e.g., verb tenses, adjectives) to the "grammar" array.
                        - Extract vocabulary items (e.g., flashcards of nouns, adjectives, etc.) and add them to the "vocabulary" array.
                        - Add any relevant activities or exercises to the "activities" array.
                
                3. Ensure that grammar concepts inferred from the content (e.g., "present perfect tense" from sentences) are added to the "grammar" array.
                4. Think logically and categorize text based on its context. For example:
                    - Adjectives from flashcards should go to both "vocabulary" (as words) and "grammar" (as "adjectives").
                    - Sentences written on the whiteboard should go to "phrasesAndSentences," and their grammatical structure (e.g., "past continuous tense") should go to "grammar."
                
                Images:`
            },
            ...imageUrls.map(url => ({
                type: "image_url",
                image_url: { url }
            }))
        ]
    }
];


  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages
    });

    const content = completion.choices[0].message.content;

    // Try to parse the content as JSON
    let data;
    try {
      data = JSON.parse(content);
    } catch (err) {
      console.error('Failed to parse model output as JSON:', err);
      return res.status(500).json({ error: 'Model did not return valid JSON.' });
    }

    // Ensure the 'hidden' array exists
    if (!data.hidden) {
      data.hidden = [];
    }

    return res.status(200).json({ processedData: data, hidden: data.hidden });

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}