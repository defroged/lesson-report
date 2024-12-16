// /api/extractLessonDataFromImages.js

import { OpenAIApi, Configuration } from "openai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { imageUrls } = req.body;
  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.status(400).json({ error: 'imageUrls is required and should be a non-empty array.' });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured.' });
  }

  try {
    const configuration = new Configuration({ apiKey: openaiApiKey });
    const openai = new OpenAIApi(configuration);

    // Construct the user message with all images
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the following information from these images:\n- A list of activities observed\n- Grammar points relevant to a language lesson\n- Phrases and sentences that can be derived\n- Vocabulary words for objects or elements visible\n\nReturn the data in JSON format with keys: activities, grammar, phrasesAndSentences, vocabulary.\n\nImages:" },
          ...imageUrls.map(url => ({
            type: "image_url",
            image_url: { url }
          }))
        ]
      }
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: messages
    });

    const resultContent = completion.data.choices[0].message.content;

    // The response from the model should be JSON. If it's not, you might need to parse it or handle errors.
    let processedData;
    try {
      processedData = JSON.parse(resultContent);
    } catch (err) {
      console.error("Failed to parse JSON from model response:", err);
      // If model doesn't return JSON as expected, handle gracefully
      return res.status(500).json({ error: 'Model did not return valid JSON.' });
    }

    return res.status(200).json({ processedData });

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
