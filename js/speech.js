// Thin wrapper over the Web Speech API (SpeechRecognition).
// Works in Chrome / Chrome on Android. Returns a controller with start/stop.

export function isSpeechSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createRecorder({ onText, onError, onEnd }) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) {
    if (onError) onError(new Error("Tu navegador no soporta dictado por voz. Usa Chrome."));
    return null;
  }
  const recognition = new Ctor();
  recognition.lang = "es-ES";
  recognition.continuous = true;
  recognition.interimResults = true;

  let finalText = "";

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += transcript + " ";
      else interim += transcript;
    }
    if (onText) onText({ finalText: finalText.trim(), interim });
  };
  recognition.onerror = (e) => { if (onError) onError(new Error(e.error || "Error de dictado")); };
  recognition.onend = () => { if (onEnd) onEnd(finalText.trim()); };

  return {
    start: () => { finalText = ""; recognition.start(); },
    stop: () => recognition.stop(),
  };
}
