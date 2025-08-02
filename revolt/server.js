import express from 'express';
import { WebSocketServer } from 'ws';
import { AssemblyAI } from 'assemblyai';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

let assemblyAI;
try {
  if (!process.env.ASSEMBLYAI_API_KEY) {
    throw new Error('ASSEMBLYAI_API_KEY is not set in .env');
  }
  assemblyAI = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });
  console.log('AssemblyAI initialized successfully');
  console.log('Transcripts method available:', !!assemblyAI.transcripts);
} catch (error) {
  console.error('Failed to initialize AssemblyAI:', error.message);
}

async function withRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      if (error.status === 429 || error.code === 'ECONNRESET') {
        console.log(`Retrying (${i + 1}/${retries}) after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
}

async function generateGeminiResponse(text) {
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        contents: [
          {
            parts: [
              {
                text: `You are Rev, an AI assistant created by Revolt Motors. You provide information exclusively about Revolt Motors, their electric motorcycles, features, specifications, and services. Do not respond to questions unrelated to Revolt Motors. Respond in a friendly, professional tone, and keep answers concise and relevant. User query: ${text}`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

app.use(express.static(path.join(__dirname, 'public')));

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', async (ws) => {
  console.log('Client connected');

  ws.on('message', async (data) => {
    try {
      console.log('Received audio buffer size:', data.byteLength);

      if (!assemblyAI || !assemblyAI.transcripts) {
        throw new Error('AssemblyAI client or transcripts method is undefined');
      }

      // --- **FINAL FIX: 2-STEP TRANSCRIPTION PROCESS** ---

      // Step 1: Upload the audio buffer to AssemblyAI's servers
      console.log('Step 1: Uploading file...');
      const uploadUrl = await assemblyAI.files.upload(data);
      console.log('File uploaded successfully. URL:', uploadUrl);

      // Step 2: Use the returned URL to create the transcript
      console.log('Step 2: Creating transcript from uploaded file...');
      const transcription = await assemblyAI.transcripts.create({
        audio_url: uploadUrl, // 'audio' ki jagah 'audio_url' use karein
      });

      // --- FIX ENDS HERE ---

      const transcribedText = transcription.text || 'No transcription available';
      console.log('Transcription result:', transcribedText);

      const text = transcribedText === 'No transcription available'
        ? 'Sorry, I couldn’t understand the audio. Please try again.'
        : await withRetry(() => generateGeminiResponse(transcribedText));

      const ttsResponse = await axios.post(
        'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
        {
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.5 },
        },
        {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      ws.send(JSON.stringify({
        type: 'audio',
        data: Buffer.from(ttsResponse.data).toString('base64'),
      }));
      ws.send(JSON.stringify({
        type: 'text',
        data: text,
      }));
      ws.send(JSON.stringify({ type: 'turn_complete' }));

    } catch (error) {
      console.error('FULL ERROR DETAILS:', error); 
      ws.send(JSON.stringify({ type: 'error', data: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});