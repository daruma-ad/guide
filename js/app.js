// ========================================
// AI忍者くん — メインアプリケーション
// ========================================

import { sendToGemini } from './ai-engine.js';
import { SpeechManager } from './speech.js';
import { SUPPORTED_LANGUAGES, getApiKey, setApiKey } from './config.js';

// ---- State ----
let selectedLang = 'en';
let selectedLangLabel = 'English';
let conversationHistory = [];
let isProcessing = false;

// ---- DOM refs ----
const welcomeScreen  = document.getElementById('welcome-screen');
const chatScreen     = document.getElementById('chat-screen');
const chatMessages   = document.getElementById('chat-messages');
const chatInput      = document.getElementById('chat-input');
const btnSend        = document.getElementById('btn-send');
const btnVoice       = document.getElementById('btn-voice');
const btnBack        = document.getElementById('btn-back');
const btnSettings    = document.getElementById('btn-settings');
const btnPrice       = document.getElementById('btn-price');
const langBadge      = document.getElementById('current-lang-badge');
const priceModal     = document.getElementById('price-modal');
const priceModalClose = document.getElementById('price-modal-close');
const settingsOverlay = document.getElementById('settings-overlay');
const apiKeyInput    = document.getElementById('api-key-input');
const btnSaveSettings = document.getElementById('btn-save-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');

// ---- Speech ----
const speech = new SpeechManager();

// ========================================
// 初期化
// ========================================
function init() {
  // 言語ボタン
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // iOS/Safari対策: ユーザーアクション内で音声を「アンロック」する
      speech.unlockAudio();

      selectedLang = btn.dataset.lang;
      selectedLangLabel = btn.dataset.label;
      startChat();
    });
  });

  // 送信
  btnSend.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // テキストエリア自動リサイズ
  chatInput.addEventListener('input', autoResizeInput);

  // 音声入力
  btnVoice.addEventListener('click', () => speech.toggleListening());
  speech.onResult = (transcript) => {
    chatInput.value = transcript;
    autoResizeInput();
    handleSend();
  };
  speech.onListeningChange = (listening) => {
    btnVoice.classList.toggle('listening', listening);
  };

  // 戻る
  btnBack.addEventListener('click', backToWelcome);

  // 設定
  btnSettings.addEventListener('click', openSettings);
  btnSaveSettings.addEventListener('click', saveSettings);
  btnCloseSettings.addEventListener('click', closeSettings);
  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) closeSettings();
  });

  // 料金ボタン (手動表示)
  btnPrice.addEventListener('click', () => {
    priceModal.classList.add('active');
  });

  // 料金モーダル
  priceModalClose.addEventListener('click', () => {
    priceModal.classList.remove('active');
  });
  priceModal.addEventListener('click', (e) => {
    if (e.target === priceModal) priceModal.classList.remove('active');
  });

  // 音声ボタン非表示（非対応の場合）
  if (!speech.isSupported) {
    btnVoice.style.display = 'none';
  }
}

// ========================================
// 画面遷移
// ========================================
function startChat() {
  welcomeScreen.classList.remove('active');
  chatScreen.classList.add('active');
  langBadge.textContent = selectedLangLabel;
  
  // 音声認識の言語設定
  const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang);
  if (langConfig) {
    speech.setLanguage(langConfig.speechCode);
  }

  // 会話リセット
  conversationHistory = [];
  chatMessages.innerHTML = '';

  // 忍者の初回あいさつ
  showGreeting();
}

function backToWelcome() {
  chatScreen.classList.remove('active');
  welcomeScreen.classList.add('active');
  speech.stopSpeaking();
}

// ========================================
// 初回あいさつ
// ========================================
function showGreeting() {
  const greetings = {
    'en':    { foreign: "Welcome to Darumaya! ✨ I'm Komachi, your kimono guide. How can I help you today?", ja: 'だるまやへようこそ！✨ 看板娘の小町です。着物のご案内をさせていただきますね。何でもお聞きください！' },
    'zh-TW': { foreign: '歡迎來到達摩屋！✨ 我是小町，您的和服嚮導。有什麼可以幫您的嗎？', ja: 'だるまやへようこそ！✨ 看板娘の小町です。着物のご案内をさせていただきますね。何でもお聞きください！' },
    'zh-CN': { foreign: '欢迎来到达摩屋！✨ 我是小町，您的和服向导。有什么可以帮您的吗？', ja: 'だるまやへようこそ！✨ 看板娘の小町です。着物のご案内をさせていただきますね。何でもお聞きください！' },
    'ko':    { foreign: '다루마야에 오신 것을 환영합니다! ✨ 코마치입니다. 기모노 안내를 도와드리겠습니다!', ja: 'だるまやへようこそ！✨ 看板娘の小町です。着物のご案内をさせていただきますね。何でもお聞きください！' },
    'fr':    { foreign: 'Bienvenue chez Darumaya ! ✨ Je suis Komachi, votre guide kimono. Comment puis-je vous aider ?', ja: 'だるまやへようこそ！✨ 看板娘の小町です。着物のご案内をさせていただきますね。何でもお聞きください！' },
    'es':    { foreign: '¡Bienvenido a Darumaya! ✨ Soy Komachi, tu guía de kimono. ¿En qué puedo ayudarte?', ja: 'だるまやへようこそ！✨ 看板娘の小町です。着物のご案内をさせていただきますね。何でもお聞きください！' },
    'th':    { foreign: 'ยินดีต้อนรับสู่ดารุมายะ! ✨ ฉันคือโคมะจิ ไกด์กิโมโนของคุณ จะให้ช่วยอะไรดีคะ?', ja: 'だるまやへようこそ！✨ 看板娘の小町です。着物のご案内をさせていただきますね。何でもお聞きください！' },
    'auto':  { foreign: "Welcome to Darumaya! ✨ I'm Komachi. Please speak in your language — I'll understand!", ja: 'だるまやへようこそ！✨ 看板娘の小町です。お好きな言語で話しかけてくださいね！' },
  };

  const greeting = greetings[selectedLang] || greetings['en'];
  appendNinjaMessage(greeting.foreign, greeting.ja);
}

// ========================================
// メッセージ送信処理
// ========================================
async function handleSend() {
  const text = chatInput.value.trim();
  if (!text || isProcessing) return;

  isProcessing = true;
  chatInput.value = '';
  autoResizeInput();
  btnSend.disabled = true;

  // お客様メッセージを表示
  appendCustomerMessage(text);

  // ローディング表示
  const loadingEl = appendLoading();

  // 会話履歴にユーザーメッセージを追加
  conversationHistory.push({ role: 'user', text });

  try {
    const result = await sendToGemini(text, conversationHistory, selectedLang);

    // ローディング削除
    loadingEl.remove();

    // 忍者の返答を表示（外国語 + 日本語訳を同時に）
    appendNinjaMessage(result.response_foreign, result.response_ja, result.customer_message_ja);

    // 会話履歴にAI応答を追加
    conversationHistory.push({
      role: 'model',
      text: JSON.stringify({
        response_foreign: result.response_foreign,
        response_ja: result.response_ja,
      }),
    });

    // 言語バッジ更新
    if (result.detected_language && selectedLang === 'auto') {
      langBadge.textContent = result.detected_language;
    }

    // システムタグ処理
    if (result.system_tags?.includes('SHOW_PRICE_LIST')) {
      setTimeout(() => {
        priceModal.classList.add('active');
      }, 500);
    }

    // 音声読み上げ
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.label === result.detected_language || l.code === selectedLang);
    speech.speak(result.response_foreign, langConfig?.speechCode || 'en-US');

  } catch (err) {
    loadingEl.remove();
    appendNinjaMessage(
      'Sorry, something went wrong. Please try again! 🙏',
      'エラーが発生しました。もう一度お試しください 🙏'
    );
  }

  isProcessing = false;
  btnSend.disabled = false;
  chatInput.focus();
}

// ========================================
// UI描画
// ========================================

/** お客様のメッセージ */
function appendCustomerMessage(text) {
  const bubble = document.createElement('div');
  bubble.className = 'message customer-message';
  bubble.innerHTML = `
    <div class="message-avatar customer-avatar">🧑</div>
    <div class="message-body">
      <div class="bubble customer-bubble">${escapeHtml(text)}</div>
    </div>
  `;
  chatMessages.appendChild(bubble);
  scrollToBottom();
}

/** 忍者のメッセージ（外国語＋日本語訳を同時表示） */
function appendNinjaMessage(foreignText, jaText, customerJaText) {
  const bubble = document.createElement('div');
  bubble.className = 'message ninja-message';

  let customerTranslation = '';
  if (customerJaText) {
    customerTranslation = `
      <div class="translation-hint">
        <span class="translation-label">📝 お客様の発言（日本語訳）</span>
        <span class="translation-text">${escapeHtml(customerJaText)}</span>
      </div>
    `;
  }

  bubble.innerHTML = `
    <div class="message-avatar ninja-avatar"></div>
    <div class="message-body">
      ${customerTranslation}
      <div class="bubble ninja-bubble foreign-text">${escapeHtml(foreignText)}</div>
      <div class="bubble ninja-bubble-ja ja-text">${escapeHtml(jaText)}</div>
    </div>
  `;
  
  chatMessages.appendChild(bubble);
  
  // アニメーション
  requestAnimationFrame(() => {
    bubble.classList.add('visible');
  });
  
  scrollToBottom();
}

/** ローディングアニメーション */
function appendLoading() {
  const loading = document.createElement('div');
  loading.className = 'message ninja-message loading-message';
  loading.innerHTML = `
    <div class="message-avatar ninja-avatar"></div>
    <div class="message-body">
      <div class="bubble ninja-bubble loading-bubble">
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;
  chatMessages.appendChild(loading);
  scrollToBottom();
  return loading;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function autoResizeInput() {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========================================
// 設定パネル
// ========================================
function openSettings() {
  apiKeyInput.value = getApiKey();
  settingsOverlay.classList.add('active');
}

function saveSettings() {
  setApiKey(apiKeyInput.value.trim());
  closeSettings();
}

function closeSettings() {
  settingsOverlay.classList.remove('active');
}

// ========================================
// 起動
// ========================================
init();
