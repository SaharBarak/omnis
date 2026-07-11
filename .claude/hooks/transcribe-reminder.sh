#!/usr/bin/env bash
# UserPromptSubmit hook — when the user asks to transcribe a link, inject the
# standing transcription workflow so it is always followed. Silent otherwise.
input=$(cat)
prompt=$(printf '%s' "$input" | jq -r '.prompt // ""' 2>/dev/null)
[ -z "$prompt" ] && exit 0

if printf '%s' "$prompt" | grep -qiE 'transcrib' \
  && printf '%s' "$prompt" | grep -qiE 'https?://|instagram\.com|youtube\.com|youtu\.be|tiktok\.com'; then
  ctx='Transcription workflow (project rule): transcribe the supplied link LOCALLY — yt-dlp --cookies-from-browser chrome to download, then faster-whisper (small model, int8) to transcribe. No third-party transcription service. Save the result as a source-attributed markdown file in the transcriptions/ folder of the SaharBarak/skills-and-workflows GitHub repo (clone or pull it first), then commit + push authored as SaharBarak with NO Claude/Anthropic co-authors.'
  jq -n --arg c "$ctx" '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:$c}}'
fi
exit 0
