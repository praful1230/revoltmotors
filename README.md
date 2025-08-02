# Real-Time AI Voice Assistant

This project is a real-time, conversational AI voice assistant built with Node.js. It captures audio from the user's microphone, converts it to text, generates an intelligent response using a large language model, and synthesizes the response back into speech, creating a seamless, interactive experience.

## Features

-   🎤 **Real-Time Transcription**: Captures live audio from the microphone and transcribes it into text using AssemblyAI.
-   🧠 **AI-Powered Responses**: Leverages Google's Gemini API to generate context-aware and intelligent answers.
-   🗣️ **Natural Speech Synthesis**: Converts the AI-generated text response into natural-sounding speech using the ElevenLabs API.
-   🌐 **Full-Duplex Communication**: Utilizes WebSockets for low-latency, real-time communication between the client and the server.
-   🛠️ **Robust & Resilient**: Includes a retry mechanism with exponential backoff to handle transient network errors and API rate limits gracefully.

## Technology Stack

-   **Backend**: Node.js, Express.js
-   **Real-time Communication**: `ws` (WebSocket library)
-   **API Services**:
    -   **Speech-to-Text**: [AssemblyAI](https://www.assemblyai.com/)
    -   **Generative AI**: [Google Gemini](https://ai.google.dev/)
    -   **Text-to-Speech**: [ElevenLabs](https://elevenlabs.io/)
-   **Frontend**: HTML, CSS, JavaScript (using the Web Audio API)
-   **Environment Management**: `dotenv`

## Project Setup & Installation

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (version 18.0 or higher) installed on your system.

### 2. Clone the Repository

```bash
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name
