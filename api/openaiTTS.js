// /api/openaiTTS.js
import OpenAI from 'openai';
import admin from 'firebase-admin';

// --- Firebase Admin SDK Initialization ---
// This uses the environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// Your Vercel environment variables should be set up for these.

// Debugging logs for environment variables and bucket name
console.log('[openaiTTS - Debug] Raw FIREBASE_PROJECT_ID from env:', process.env.FIREBASE_PROJECT_ID);

const GCS_BUCKET_NAME = `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`; 
console.log('[openaiTTS - Debug] Constructed GCS_BUCKET_NAME:', GCS_BUCKET_NAME);

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Ensure private key newlines are correctly interpreted
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Initialize Firebase Admin SDK only if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: GCS_BUCKET_NAME,
    });
    console.log(`[openaiTTS - FirebaseAdmin] Initialized successfully for bucket: ${GCS_BUCKET_NAME}`);
  } catch (error) {
    console.error(`[openaiTTS - FirebaseAdmin] Error initializing for bucket ${GCS_BUCKET_NAME}:`, error.message);
    // This is a critical error if Firebase is needed.
  }
}
// --- End Firebase Admin SDK Initialization ---

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `メソット ${req.method} はダメだよ。(Method Not Allowed)` });
    }

    console.log("[openaiTTS] Received request.");

    try {
        const { text } = req.body;

        if (!text) {
            console.error("[openaiTTS] Error: Text data is required.");
            return res.status(400).json({ error: '説明するテキストがないと話せないよ。(Text data is required.)' });
        }
        console.log("[openaiTTS] Text received for synthesis (first 200 chars):", text.substring(0, 200) + (text.length > 200 ? "..." : ""));

        const ttsModel = 'gpt-4o-mini-tts';
        const voice = 'coral';
        const responseFormat = 'mp3'; // This is already set to mp3, which is good.

        console.log(`[openaiTTS] Requesting TTS from OpenAI. Model: ${ttsModel}, Voice: ${voice}, Format: ${responseFormat}`);

        const speechResponse = await openai.audio.speech.create({
            model: ttsModel,
            input: text,
            voice: voice,
            response_format: responseFormat, // Correctly requests MP3
            instructions: "Accent/Affect: Warm, refined, and gently instructive, reminiscent of a friendly art instructor.\n\nTone: Calm, encouraging, and articulate, clearly describing each step with patience.\n\nPacing: Slow and deliberate, creating a long pause and waiting where it says [pause] to allow the listener to follow instructions comfortably.\n\nEmotion: Cheerful, supportive, and pleasantly enthusiastic; convey genuine enjoyment and appreciation of art.\n\nPronunciation: Clearly articulate artistic terminology (e.g., \"brushstrokes,\" \"landscape,\" \"palette\") with gentle emphasis.\n\nPersonality Affect: Friendly and approachable with a hint of sophistication; speak confidently and reassuringly, guiding users through each painting step patiently and warmly. When pronouncing words in English, say them in a native English speaker accent and DO NOT use a Japanese accent for these words.",
        });

        const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
        console.log("[openaiTTS] Audio content received from OpenAI as buffer. Size (bytes):", audioBuffer.length);

        // --- Upload to Firebase Storage ---
        if (!admin.apps.length) {
          // This check is a fallback. Initialization should happen above.
          // If it reaches here and admin is not initialized, it's an issue.
          console.error("[openaiTTS] Firebase Admin SDK not initialized. Cannot upload file.");
          throw new Error("Firebase Admin SDK not initialized. File upload failed.");
        }
        
        const storage = admin.storage();
        const bucket = storage.bucket(); // Gets the default bucket initialized with GCS_BUCKET_NAME

        const uniqueId = Date.now(); // Simple unique ID
        const destinationFolder = "HwHelperAudio";
        const fileName = `${destinationFolder}/audio-${uniqueId}.mp3`;
        
        const file = bucket.file(fileName);

        console.log(`[openaiTTS] Attempting to upload to Firebase Storage: gs://${GCS_BUCKET_NAME}/${fileName}`);

        await file.save(audioBuffer, {
            metadata: {
                contentType: 'audio/mpeg', // Set content type for correct handling by browsers/players
            },
        });
        console.log(`[openaiTTS] File saved to Firebase Storage: ${fileName}`);

        // Make the file publicly readable
        await file.makePublic();
        console.log(`[openaiTTS] File ${fileName} made public.`);

        // Get the public URL (standard GCS format)
        const publicUrl = file.publicUrl(); 
        // This typically looks like: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${fileName}`
        console.log(`[openaiTTS] Public URL: ${publicUrl}`);

        // Send the public URL back to the client
        res.status(200).json({ audioUrl: publicUrl });
        // --- End Upload to Firebase Storage ---

    } catch (error) {
        console.error('[openaiTTS] Error during processing:', error.message);
        // Consolidate error logging for different error structures
        if (error.response && error.response.data) { // Axios-like error from some HTTP clients
            console.error('[openaiTTS] Error Details (response.data):', JSON.stringify(error.response.data, null, 2));
        } else if (error.status && error.error) { // OpenAI SDK specific error structure
             console.error('[openaiTTS] Error Status:', error.status);
             console.error('[openaiTTS] Error Headers:', error.headers);
             console.error('[openaiTTS] Error Body:', error.error);
        } else {
            console.error('[openaiTTS] Full Error Object:', error);
        }

        let errorMessage = '声の作成または保存でエラーが起きたみたい。(Error generating or saving speech.)';
        let errorDetails = error.status || error.code || 'Unknown error structure';

        // Refine error messages based on potential error sources
        if (error.name === 'FirebaseError' || error.message.includes('Firebase')) {
            errorMessage = `音声ファイルの保存でエラーが起きたみたい (Firebase Storage): ${error.message}`;
        } else if (error.status && error.error && error.error.message) { // OpenAI error
            errorMessage = error.error.message;
            if (error.status === 400 && error.error.code === 'invalid_request_error' && error.error.message.includes('model')) {
                 errorMessage = `指定されたTTSモデル「${'gpt-4o-mini-tts'}」が見つからないか、まだ利用できない可能性があります。別のモデル (例: tts-1) を試してください。(${error.error.message})`;
            } else if (error.status === 400) {
                 errorMessage = `OpenAI TTSへのリクエストが無効です。入力テキストやパラメータを確認してください。(${error.message})`;
            }
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return res.status(500).json({
            error: errorMessage,
            details: errorDetails
        });
    }
}