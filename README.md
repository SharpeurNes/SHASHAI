SHASHAI is a project where an AI can read twitch chat, interract with text or voice, avatar movement, TTS generation using chatterbox

Require: Chatterbox-tts-api for TTS, Gemini API key for LLM, VNyan for avatar controll

You can change the SYSTEM_PROMPT inside src/llm.js

Exemple .env:

TWITCH_BOT_USERNAME=
TWITCH_OAUTH_TOKEN=oauth:
TWITCH_CHANNEL=

GEMINI_API_KEY=

PICK_INTERVAL_SECONDS=10

CHATTERBOX_URL=http://localhost:4123
CHATTERBOX_VOICE=

EXCLUDED_USERNAMES=wizebot,streamelements,nightbot,moobot
