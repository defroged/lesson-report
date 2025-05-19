// /api/openaiVision.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `メソット ${req.method} はダメだよ。 (Method Not Allowed)` });
    }

    console.log("[openaiVision] Received request.");

    try {
        const { images: imageDataUris } = req.body; // Expect an array of image data URIs

        if (!imageDataUris || !Array.isArray(imageDataUris) || imageDataUris.length === 0) {
            console.error("[openaiVision] Error: Image data array is required and cannot be empty.");
            return res.status(400).json({ error: '画像データがないと説明できないよ。(Image data array is required.)' });
        }

        // Validate each URI (basic check)
        for (const uri of imageDataUris) {
            if (typeof uri !== 'string' || !uri.startsWith('data:image/')) {
                console.error("[openaiVision] Error: Invalid image data URI detected in the array:", uri.substring(0,30) + "...");
                return res.status(400).json({ error: '送られた画像データの中に正しくないものがあったみたい。(Invalid image data URI in array.)' });
            }
        }

        const promptText = "I would like you to create a detailed explanation in Japanese of how to complete this homework, by addressing all of the tasks. As you go along with your explanation, you can start giving hints instead of answers in a way that a teacher might do by asking questions, and letting the child think about the answer, and only then providing the answer. Your explanation should be aimed at children, so please use friendly and supportive language in ため口. Please do not add any asterisks, brackets or any other special characters into your response, and only use commas and periods. Your response should also be writtien in a natural speaking language meant for conversational like speech. These homework papers are usually self explanatory if no instructions are written. If in the case that no instructions are written, think carefully about how the homework is supposed to be completed before providing your response (Are the students supposed to color in the pictures? Are they supposed to circle the correct answers?). If multiple images are provided, assume they are part of the same homework assignment, possibly multiple pages or related tasks, and provide a cohesive explanation that covers all of them."; 

        const contentParts = [{ type: "text", text: promptText }];

        imageDataUris.forEach(uri => {
            contentParts.push({
                type: "image_url",
                image_url: {
                    "url": uri,
                    "detail": "auto" // "high" could be used for more detail if needed, "auto" is usually fine.
                },
            });
        });

        const openAIRequestPayload = {
            model: "gpt-4o", // or "gpt-4-turbo" or other model that supports vision
            messages: [
                {
                    role: "user",
                    content: contentParts, // Use the dynamically built array with text and image URLs
                },
            ],
            max_tokens: 1500, // Increased slightly for potentially more content from multiple images
        };

        // Log the request payload
        console.log("[openaiVision] Sending request to OpenAI. Model:", openAIRequestPayload.model);
        console.log("[openaiVision] OpenAI Prompt Text:", promptText); // Prompt text is the same
        console.log(`[openaiVision] Number of images being sent: ${imageDataUris.length}`);
        if (imageDataUris.length > 0) {
            console.log("[openaiVision] First OpenAI Image Data URI (first 100 chars):", imageDataUris[0].substring(0, 100) + (imageDataUris[0].length > 100 ? "..." : ""));
        }
        console.log("[openaiVision] OpenAI Max Tokens:", openAIRequestPayload.max_tokens);


        const response = await openai.chat.completions.create(openAIRequestPayload);
        console.log("[openaiVision] Received response from OpenAI.");

        if (!response.choices || response.choices.length === 0 || !response.choices[0].message || !response.choices[0].message.content) {
            console.error('[openaiVision] OpenAI API response format unexpected:', JSON.stringify(response, null, 2));
            return res.status(500).json({ error: 'AI先生からの応答がちょっと変だったみたい。(Invalid response from AI.)' });
        }

        const explanation = response.choices[0].message.content.trim();
        console.log("[openaiVision] Explanation from OpenAI (first 200 chars):", explanation.substring(0, 200) + (explanation.length > 200 ? "..." : ""));
        // For full explanation if needed for debugging, but can be very long:
        // console.log("[openaiVision] Full Explanation from OpenAI:", explanation);

        res.status(200).json({ explanation });

    } catch (error) {
        console.error('[openaiVision] OpenAI API Error:', error.message);
        if (error.response && error.response.data) {
            console.error('[openaiVision] OpenAI API Error Details:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('[openaiVision] OpenAI API Error (no response data):', error);
        }
        let errorMessage = 'AI先生との通信でエラーが起きたみたい。(Error communicating with OpenAI API.)';
        if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
            errorMessage = error.response.data.error.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        return res.status(500).json({ error: errorMessage, details: error.code || error.type });
    }
}