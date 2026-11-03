# سؤال المساعد بالصوت والرد بالصوت والكتابة

## ما سيراه المستخدم
- زر مايك بجانب خانة الكتابة في نافذة المساعد.
- يضغط ويتكلم، ثم يضغط مرة ثانية للإرسال (يظهر مؤشر «جاري التسجيل…» أحمر نابض).
- يظهر سؤاله مكتوبا في الدردشة، ثم يظهر رد المساعد مكتوبا ويُقرأ بصوت عربي تلقائيا.
- زر سماعة صغير على كل رد لإعادة سماعه أو إيقافه.
- الكتابة العادية تبقى كما هي (الرد بالكتابة فقط حينها).

## Technical details
- Server functions in `src/lib/voice.functions.ts`:
  - `transcribe`: audio (base64 webm) -> text via `transcribeAudio` with `openai/gpt-transcribe` (Arabic).
  - `speak`: text -> audio via `generateSpeech` with `google/gemini-3.1-flash-tts-preview`, returned as base64.
  - Existing `askAssistant` reused for the answer.
- Vercel: like the assistant, when `LOVABLE_API_KEY` is missing forward to new public routes `/api/public/transcribe` and `/api/public/speak` on the Lovable domain (CORS, size limits).
- `AssistantWidget.tsx`: MediaRecorder mic button, recording state, playback via `Audio`, replay/stop button per message; mic permission error message in Arabic.
- Install `@lovable.dev/ai-gateway` if missing and generate types for the two models.
- Requires internet (no offline voice).
