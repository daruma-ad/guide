// ========================================
// AI忍者くん — 音声入出力管理
// ========================================

export class SpeechManager {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.onResult = null;
    this.onListeningChange = null;
    this._initRecognition();
  }

  _initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (this.onResult) this.onResult(transcript);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onListeningChange) this.onListeningChange(false);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      if (this.onListeningChange) this.onListeningChange(false);
    };
  }

  /** 音声認識のlang設定 */
  setLanguage(speechCode) {
    if (this.recognition) {
      this.recognition.lang = speechCode || '';
    }
  }

  /** マイク開始/停止 トグル */
  toggleListening() {
    if (!this.recognition) {
      alert('お使いのブラウザは音声認識に対応していません');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.isListening = true;
      if (this.onListeningChange) this.onListeningChange(true);
      this.recognition.start();
    }
  }

  /** テキストを読み上げ */
  speak(text, langCode) {
    if (!this.synthesis) return;
    this.synthesis.cancel(); // 前の読み上げを停止

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    // 適切な音声を選択
    const voices = this.synthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(langCode?.split('-')[0] || 'en'));
    if (matchedVoice) utterance.voice = matchedVoice;

    this.synthesis.speak(utterance);
  }

  /** 読み上げ停止 */
  stopSpeaking() {
    if (this.synthesis) this.synthesis.cancel();
  }

  /** サポート状況 */
  get isSupported() {
    return !!this.recognition;
  }
}
