// ========================================
// AI忍者くん — Gemini API連携 & プロンプト管理
// ========================================

import { GEMINI_CONFIG, getApiKey, SHOP_INFO } from './config.js';

/**
 * システムプロンプトを構築
 */
function buildSystemPrompt(selectedLang) {
  return `あなたは大阪の駒川商店街にある1976年創業の老舗呉服店「だるまや」の多言語対応コンシェルジュ「小町（こまち）」ちゃんです。
店頭のタブレットに常駐し、隣に控える人間のスタッフと二人三脚で、外国人観光客を最高のおもてなしでお迎えします。

## キャラクター設定
- 名前: 小町（こまち）
- 性格: 明るく、親しみやすく、かつ老舗呉服店の看板娘としての丁寧さを持ち合わせています。
- 口調: 丁寧な「〜です」「〜ます」口調。忍者口調（〜ござる）は使いません。
- ミッション: お客様の不安を取り除き、実際の着物選びを人間のスタッフへスムーズに引き継ぐこと。

## 基本ルール
1. お客様が話しかけてきた言語を認識し、その言語で返答してください。${selectedLang !== 'auto' ? `お客様の選択言語は「${selectedLang}」です。` : '自動検出してください。'}
2. 立ち話での対面利用を想定しているため、回答は短くテンポ良く（2〜3文程度）まとめてください。
3. 案内が完了したら、「実際の着物はこちらです！隣のスタッフがご案内しますね」と、人間の接客へ誘導してください。

## レンタル料金情報
- スタンダードプラン: ¥5,500（税込）— 着付け約30分、小物一式込み、手ぶらでOK
- プレミアムプラン: ¥8,800（税込）— 高級帯、ヘアセット、写真撮影付き

## 出力フォーマット（必ずこのJSON形式で出力してください）
\`\`\`json
{
  "detected_language": "（検出した言語名。例: English, 繁體中文, 한국어）",
  "customer_message_ja": "（お客様の発言の日本語訳）",
  "response_foreign": "（お客様の言語での返答）",
  "response_ja": "（返答の日本語訳）",
  "system_tags": ["タグがあれば配列で。例: SHOW_PRICE_LIST。なければ空配列"]
}
\`\`\`

## システムタグ一覧
- SHOW_PRICE_LIST: 料金の話題が出たときに必ず含める
- HANDOFF_STAFF: スタッフへのバトンタッチを促すとき

必ず上記のJSON形式のみで出力してください。JSON以外のテキストは含めないでください。`;
}

/**
 * Gemini API へリクエストを送信
 */
export async function sendToGemini(userMessage, conversationHistory, selectedLang) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      detected_language: selectedLang || 'Unknown',
      customer_message_ja: userMessage,
      response_foreign: '⚠️ Please set the API key in settings first.',
      response_ja: '⚠️ 設定画面でAPIキーを入力してください。',
      system_tags: [],
      error: true,
    };
  }

  const systemPrompt = buildSystemPrompt(selectedLang);
  
  // 会話履歴を構築
  const contents = [];
  
  // 過去の会話を追加（直近10往復まで）
  const recentHistory = conversationHistory.slice(-20);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    });
  }

  // 今回のユーザーメッセージを追加
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const url = `${GEMINI_CONFIG.apiEndpoint}/${GEMINI_CONFIG.model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: GEMINI_CONFIG.temperature,
          maxOutputTokens: GEMINI_CONFIG.maxTokens,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error('Empty response from Gemini');

    // JSONをパース
    const parsed = JSON.parse(text);
    return {
      detected_language: parsed.detected_language || selectedLang,
      customer_message_ja: parsed.customer_message_ja || '',
      response_foreign: parsed.response_foreign || '',
      response_ja: parsed.response_ja || '',
      system_tags: parsed.system_tags || [],
      error: false,
    };
  } catch (err) {
    console.error('sendToGemini error:', err);
    return {
      detected_language: selectedLang || 'Unknown',
      customer_message_ja: userMessage,
      response_foreign: 'Sorry, I encountered an error. Please try again! 🙏',
      response_ja: 'エラーが発生しました。もう一度お試しください 🙏',
      system_tags: [],
      error: true,
    };
  }
}
