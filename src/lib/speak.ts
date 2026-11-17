// Read Hindi text aloud with the phone's or computer's own voice (free, no internet needed on most phones).

export type SpeakResult = 'speaking' | 'no-hindi-voice' | 'unsupported';

function hindiVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('hi'));
}

/** Start reading; calls onEnd when finished or stopped. */
export function speakHindi(text: string, onEnd: () => void): SpeakResult {
  if (!('speechSynthesis' in window)) return 'unsupported';
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'hi-IN';
  u.rate = 0.9;
  const voice = hindiVoice();
  if (voice) u.voice = voice;
  u.onend = onEnd;
  u.onerror = onEnd;
  synth.speak(u);
  // Some browsers load voices late; with no Hindi voice the text may be read badly, so tell the person.
  return voice || synth.getVoices().length === 0 ? 'speaking' : 'no-hindi-voice';
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
