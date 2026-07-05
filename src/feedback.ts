export const FEEDBACK_EMAIL = "bkdsq192@gmail.com";
export const FEEDBACK_SUBJECT = "無料ツールの感想｜有料note改善ナビ";

export const FEEDBACK_TOOL_OPTIONS = [
  "有料note改善・実践スプレッドシート",
  "有料note改善ナビ",
] as const;

export const FEEDBACK_PROGRESS_OPTIONS = [
  "開いただけ",
  "記入例を確認した",
  "途中まで入力した",
  "最後まで入力した",
  "結果まとめ、最終設計書まで作成した",
] as const;

export const FEEDBACK_MOST_HELPFUL_OPTIONS = [
  "タイトルの見直し",
  "無料部分の見直し",
  "有料部分の見直し",
  "X・Threads導線の整理",
  "優先して直す3項目の決定",
  "7日間改善計画・最終設計書",
  "その他",
] as const;

export const FEEDBACK_CONFUSING_OPTIONS = [
  "どこから始めればよいか分かりにくかった",
  "「明確・一部・未記入」の判定に迷った",
  "「根拠・現状」に何を書くか迷った",
  "「次に直すこと」に何を書くか迷った",
  "優先して直す3項目の選び方に迷った",
  "保存・JSON書き出し・別端末への移行が分かりにくかった",
  "その他",
] as const;

export const FEEDBACK_CONFUSING_NONE_OPTION = "特に迷わなかった";

export const FEEDBACK_WANTED_FEATURE_OPTIONS = [
  "自分の経験・知識を棚卸しする機能",
  "読者と悩みを整理する機能",
  "noteのタイトル案を複数作る機能",
  "見出し構成・記事の設計図を作る機能",
  "ChatGPTへ貼り付ける原稿作成プロンプトを作る機能",
  "X・Threadsの紹介投稿案を作る機能",
  "その他",
] as const;

export const FEEDBACK_PERMISSION_OPTIONS = ["匿名なら掲載してよい", "掲載しないでほしい"] as const;

export interface FeedbackFormValues {
  usedTools: string[];
  progress: string;
  mostHelpful: string;
  mostHelpfulOther: string;
  confusingParts: string[];
  confusingPartsOther: string;
  wantedFeatures: string[];
  wantedFeaturesOther: string;
  comment: string;
  publicationPermission: string;
  name: string;
  email: string;
}

export interface FeedbackValidationResult {
  isValid: boolean;
  fieldErrors: Partial<
    Record<
      | "usedTools"
      | "progress"
      | "mostHelpful"
      | "mostHelpfulOther"
      | "confusingPartsOther"
      | "wantedFeaturesOther"
      | "comment"
      | "publicationPermission",
      string
    >
  >;
}

function clean(value: string) {
  return value.trim();
}

function unique(values: string[]) {
  return [...new Set(values.filter((value) => clean(value)))];
}

function normalizeExclusiveOption(values: string[], exclusiveOption: string) {
  const normalized = unique(values);
  if (normalized.includes(exclusiveOption)) {
    return [exclusiveOption];
  }
  return normalized;
}

export function validateFeedback(values: FeedbackFormValues): FeedbackValidationResult {
  const fieldErrors: FeedbackValidationResult["fieldErrors"] = {};

  if (values.usedTools.length === 0) {
    fieldErrors.usedTools = "使ったツールを1つ以上選んでください。";
  }

  if (!clean(values.progress)) {
    fieldErrors.progress = "どこまで進められたかを選んでください。";
  }

  if (!clean(values.mostHelpful)) {
    fieldErrors.mostHelpful = "一番役立った項目を選んでください。";
  }

  if (values.mostHelpful === "その他" && !clean(values.mostHelpfulOther)) {
    fieldErrors.mostHelpfulOther = "その他に役立った項目を入力してください。";
  }

  if (unique(values.confusingParts).includes("その他") && !clean(values.confusingPartsOther)) {
    fieldErrors.confusingPartsOther = "分かりにくかった部分を具体的に入力してください。";
  }

  if (unique(values.wantedFeatures).includes("その他") && !clean(values.wantedFeaturesOther)) {
    fieldErrors.wantedFeaturesOther = "次のツールに欲しい機能を入力してください。";
  }

  if (!clean(values.publicationPermission)) {
    fieldErrors.publicationPermission = "感想の掲載可否を選んでください。";
  }

  if (values.publicationPermission === "匿名なら掲載してよい" && !clean(values.comment)) {
    fieldErrors.comment = "記事で紹介できる感想を入力してください。";
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

function toLineBlock(values: string[]) {
  return values.length > 0 ? values.join("\n") : "特になし";
}

function formatOtherAwareSingle(selected: string, otherText: string) {
  if (!clean(selected)) return "特になし";
  if (selected === "その他") return `その他：${clean(otherText) || "未記入"}`;
  return selected;
}

function formatOtherAwareMultiple(selectedValues: string[], otherText: string, exclusiveOption?: string) {
  const normalized = exclusiveOption ? normalizeExclusiveOption(selectedValues, exclusiveOption) : unique(selectedValues);
  if (normalized.length === 0) return "特になし";

  const lines = normalized.map((value) => {
    if (value === "その他") {
      return `その他：${clean(otherText) || "未記入"}`;
    }
    return value;
  });

  return toLineBlock(lines);
}

function formatIdentity(values: FeedbackFormValues) {
  if (clean(values.name)) return clean(values.name);
  if (values.publicationPermission === "匿名なら掲載してよい") return "匿名";
  return "未記入";
}

export function buildFeedbackBody(values: FeedbackFormValues) {
  const normalizedConfusingParts = normalizeExclusiveOption(values.confusingParts, FEEDBACK_CONFUSING_NONE_OPTION);

  return [
    "無料ツール感想フォーム",
    "",
    "1．使ったツール",
    toLineBlock(unique(values.usedTools)),
    "",
    "2．進捗",
    clean(values.progress) || "未記入",
    "",
    "3．一番役立った項目",
    formatOtherAwareSingle(values.mostHelpful, values.mostHelpfulOther),
    "",
    "4．入力に迷った項目・分かりにくかった部分",
    formatOtherAwareMultiple(normalizedConfusingParts, values.confusingPartsOther, FEEDBACK_CONFUSING_NONE_OPTION),
    "",
    "5．次のツールに欲しい機能",
    formatOtherAwareMultiple(values.wantedFeatures, values.wantedFeaturesOther),
    "",
    "6．実際に使ってみた感想",
    clean(values.comment) || "特になし",
    "",
    "7．感想の掲載可否",
    clean(values.publicationPermission) || "未記入",
    "",
    "8．お名前・ハンドルネーム",
    formatIdentity(values),
    "",
    "9．返信先メールアドレス",
    clean(values.email) || "未記入",
  ].join("\n");
}

export function buildFeedbackGmailUrl(values: FeedbackFormValues) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: FEEDBACK_EMAIL,
    su: FEEDBACK_SUBJECT,
    body: buildFeedbackBody(values),
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function buildFeedbackMailtoUrl(values: FeedbackFormValues) {
  const params = new URLSearchParams({
    subject: FEEDBACK_SUBJECT,
    body: buildFeedbackBody(values),
  });

  return `mailto:${FEEDBACK_EMAIL}?${params.toString()}`;
}
