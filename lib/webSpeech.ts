export function speakSpanish(
  text: string,
  rate: number = 0.75,
  onEnd?: () => void,
  onStart?: () => void
): void {

  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API not supported');
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  utterance.lang = 'es-ES';
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;

  const setVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();

    const femaleVoice =
      voices.find(v =>
        v.lang === 'es-ES' &&
        v.name.toLowerCase().includes('female')
      ) ||
      voices.find(v =>
        v.lang === 'es-ES' &&
        (v.name.includes('Monica') ||
         v.name.includes('Paulina') ||
         v.name.includes('María') ||
         v.name.includes('Maria') ||
         v.name.includes('Lucia') ||
         v.name.includes('Laura') ||
         v.name.includes('Carmen'))
      ) ||
      voices.find(v => v.lang === 'es-ES') ||
      voices.find(v => v.lang.startsWith('es'));

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    setVoiceAndSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
  }
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
