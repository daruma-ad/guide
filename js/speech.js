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
    this.isUnlocked = false; // iOS用のロック解除フラグ
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
    
    // iOS/Safari対策: ユーザーアクションなしで再生しようとすると失敗する場合があるため
    // 既に開始されている場合は一旦キャンセル
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode || 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // 適切な音声を選択
    const voices = this.synthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(langCode?.split('-')[0] || 'en'));
    if (matchedVoice) utterance.voice = matchedVoice;

    // 再生
    this.synthesis.speak(utterance);
  }

  /** 
   * iOS/Safari用の音声ロック解除
   * ユーザーの最初のクリック時に呼び出す必要がある
   */
  unlockAudio() {
    if (this.isUnlocked || !this.synthesis) return;

    // 空のテキストを一度再生することで音声合成のロックを解除する
    const silent = new SpeechSynthesisUtterance(" ");
    silent.volume = 0;
    this.synthesis.speak(silent);
    
    this.isUnlocked = true;
    console.log("Audio unlocked for iOS");
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
