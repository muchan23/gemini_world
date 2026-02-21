# Complete List of Gemini API Features & Models (Official Documentation, Latest)

Google's Gemini API offers a wide range of capabilities—from text to multimodal and agent features. This document systematically summarizes all available features for ideation and implementation at hackathons.

---

## 1. Main API Features (What you can do)

Overview of the primary API endpoint capabilities that form the backbone of your application.

| Feature | Endpoint (`method`) | Summary and hackathon use cases |
| :--- | :--- | :--- |
| **Text generation** | `generateContent` | Standard one-shot text and code generation.<br>Examples: article summarization, ideation, translation, code generation. |
| **Streaming generation** | `streamGenerateContent` | Returns text incrementally without waiting for completion.<br>Examples: AI chatbots with smooth, ChatGPT-like UX. |
| **Live API (bidirectional)** | `BidiGenerateContent` | Real-time exchange of audio and video over WebSocket.<br>Examples: real-time voice assistants, AI interviewers with emotion analysis. |
| **Multimodal input** | `generateContent` etc. | Accepts not only text but also images (JPEG/PNG, etc.), video (MP4, etc.), audio (MP3, etc.), and PDF documents as input.<br>Examples: digitizing receipt images, extracting highlights from video. |
| **Batch processing** | `batchGenerateContent` | Submit multiple requests in one batch for efficient processing.<br>Examples: bulk translation or analysis of large text datasets. |
| **Function calling** | `generateContent` extension | Let the AI use external functions (e.g., APIs) to fetch information or control systems.<br>Examples: a bot that calls a weather API on user request and suggests optimal clothing. |
| **Structured outputs** | `generateContent` extension | Force API responses to conform to a specified JSON schema.<br>Examples: a reliable system that always returns `{name: "", company: "", email: ""}` from business card images. |
| **Grounding** | `generateContent` extension | Generate answers grounded in Google Search or your own data (e.g., PDFs) to reduce hallucination.<br>Examples: stock analysis reports based on the latest news. |
| **Text embeddings** | `embedContent` | Convert text or images into vector representations for AI understanding.<br>Examples: semantic search over internal documents, product recommendations. |
| **Media generation (Gen Media API)** | `(dedicated models)` | Generate images (Imagen) or video (Veo) from prompts.<br>Examples: art generation tailored to user preferences, automatic video creation from text scenarios. |
| **Text-to-speech (TTS)** | `(audio output options)` | Output the AI’s text responses as controllable, high-quality speech.<br>Examples: automatic voice narration of news articles. |

---

## 2. Complete List of Available Models (from official documentation)

A variety of models optimized by use case are available. Models marked “Preview” offer early access to the latest experimental features.

### ✨ Gemini 3 series (latest generation)
*   **Gemini 3.1 Pro (Preview)**
    *   Advanced intelligence, complex problem-solving, and strong agent and coding capabilities.
*   **Gemini 3 Flash (Preview)**
    *   Delivers performance comparable to larger models at a fraction of the cost.
*   **Nano Banana Pro (Preview)**
    *   State-of-the-art image generation and editing for context-aware native images.
*   **Gemini 3 Pro (Preview)**
    *   Cutting-edge reasoning model with advanced multimodal understanding.

### ⚡ Gemini 2.5 Flash series
*   **Gemini 2.5 Flash**
    *   Best price/performance for low-latency, high-throughput tasks that require reasoning.
*   **Nano Banana**
    *   State-of-the-art native image generation and editing designed for fast, creative workflows.
*   **Gemini 2.5 Flash Live Preview**
    *   Optimized for real-time conversational agents with native audio streaming under 1 second.
*   **Gemini 2.5 Flash TTS Preview**
    *   Controllable text-to-speech with fine-grained control over style and pace.

### ⚡ Gemini 2.5 Flash-Lite
*   **Gemini 2.5 Flash-Lite**
    *   The fastest and most cost-effective multimodal model in the 2.5 family.

### 🧠 Gemini 2.5 Pro series
*   **Gemini 2.5 Pro**
    *   Leading model for complex tasks, with advanced reasoning and coding capabilities.
*   **Gemini 2.5 Pro TTS Preview**
    *   High-fidelity speech synthesis optimized for structured workflows like podcasts and audiobooks.

---

## 3. Media Generation & Voice-Specialized Models

Dedicated models focused on “generation” beyond multimodal understanding.

### 🎬 Generative media models
*   **Veo 3.1 Preview**
    *   State-of-the-art cinematic video generation with advanced creative control and natively synced audio.
*   **Nano Banana Pro Preview / Nano Banana**
    *   Professional design and editing engine (Pro) for studio-quality 4K visuals, complex layouts, and accurate text rendering.
*   **Lyria (Experimental)**
    *   High-fidelity music generation with fine-grained creative control over instruments, BPM, and complex composition.
*   **Imagen 4**
    *   Text-to-image model with fast and ultra-fast generation and sharp output up to 2K resolution.

### 🗣️ Voice models (Live & TTS)
*   **Gemini 2.5 Flash Live Preview** (native voice reasoning / low-latency bidirectional)
*   **Gemini 2.5 Flash TTS Preview** (fast, controllable text-to-speech)
*   **Gemini 2.5 Pro TTS Preview** (high-fidelity synthesis for audiobooks, etc.)
*   **Lyria (Experimental)** (music generation)

---

## 4. Agent, Special-Task & Robotics Models

Models for more advanced autonomous actions and specialized processing.

### 🤖 Tool and agent models
*   **Computer use (Preview)**
    *   Specialized model that “sees” the digital screen and performs UI actions (click, type, move, etc.) to automate complex browser tasks.
*   **Gemini Deep Research Preview**
    *   Agent model that autonomously plans and runs multi-step research, surveying hundreds of sources and producing interactive reports with citations.

### 🧩 Special-task models
*   **Gemini Embedding**
    *   High-dimensional vector representations for advanced semantic search, text classification, and RAG systems.
*   **Gemini Robotics Preview**
    *   Advanced embodied reasoning model that understands physical space and plans multi-step tasks for robot agents.

---

## 5. Example API Combinations to Win at Hackathons

1.  **High-accuracy RAG (internal data search) system**
    *   `Gemini Embedding` (vectorize PDFs) + `Gemini 3.1 Pro` (read search results and answer logically) + `Grounding` (cite sources).
2.  **Fully automated research & voice narration bot**
    *   `Gemini Deep Research` (auto information gathering and report creation) + `Gemini 2.5 Pro TTS` (high-quality narration of the report).
3.  **Unmanned, vision-capable customer support**
    *   `Gemini 2.5 Flash Live` (real-time voice) + camera input + `Function Calling` (search internal inventory DB and process orders).
4.  **Browser automation assistant**
    *   `Computer use (Preview)` (see screen, click, type) + `Gemini 3 Flash` (quickly interpret vague user instructions).
