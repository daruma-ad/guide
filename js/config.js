// ========================================
// AI忍者くん — 設定・定数
// ========================================

export const SUPPORTED_LANGUAGES = [
  { code: 'en',    label: 'English',   flag: '🇺🇸', speechCode: 'en-US' },
  { code: 'zh-TW', label: '繁體中文',  flag: '🇹🇼', speechCode: 'zh-TW' },
  { code: 'zh-CN', label: '简体中文',  flag: '🇨🇳', speechCode: 'zh-CN' },
  { code: 'ko',    label: '한국어',    flag: '🇰🇷', speechCode: 'ko-KR' },
  { code: 'fr',    label: 'Français',  flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'es',    label: 'Español',   flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'th',    label: 'ภาษาไทย',  flag: '🇹🇭', speechCode: 'th-TH' },
];

export const PRICE_PLANS = [
  {
    name: 'スタンダード / Standard',
    price: '¥5,500',
    features: ['着付け30分 / Dressing 30min', '小物一式 / All accessories', '手ぶらOK / No bag needed'],
  },
  {
    name: 'プレミアム / Premium',
    price: '¥8,800',
    features: ['着付け30分 / Dressing 30min', '高級帯 / Premium Obi', 'ヘアセット / Hair styling', '写真撮影 / Photo session'],
  },
];

export const SHOP_INFO = {
  name: 'だるまや',
  nameEn: 'Darumaya',
  founded: 1976,
  address: '大阪市東住吉区 駒川商店街',
  addressEn: 'Komagawa Shopping Street, Higashisumiyoshi, Osaka',
};

// Gemini API の設定
export const GEMINI_CONFIG = {
  model: 'gemini-2.0-flash',
  apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  maxTokens: 1024,
  temperature: 0.7,
};

// APIキーの保存／取得（localStorage使用）
export function getApiKey() {
  return localStorage.getItem('ninja_gemini_api_key') || '';
}

export function setApiKey(key) {
  localStorage.setItem('ninja_gemini_api_key', key);
}
