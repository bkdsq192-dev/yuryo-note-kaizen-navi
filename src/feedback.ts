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

export const FEEDBACK_PERMISSION_OPTIONS = ["匿名なら掲載してよい", "掲載しないでほしい"] as const;

export interface FeedbackFormValues {
  usedTools: string[];
  progress: string;
  mostHelpful: string;
  confusingParts: string;
  wantedFeatures: string;
  publicationPermission: string;
  name: string;
  email: string;
}

export interface FeedbackValidationResult {
  isValid: boolean;
  fieldErrors: Partial<Record<"usedTools" | "progress" | "mostHelpful" | "publicationPermission", string>>;
}

function clean(value: string) {
  return value.trim();
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
    fieldErrors.mostHelpful = "一番役立った項目を入力してください。";
  }

  if (!clean(values.publicationPermission)) {
    fieldErrors.publicationPermission = "感想の掲載可否を選んでください。";
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

function fillOptional(value: string) {
  return clean(value) || "特になし";
}

function fillOptionalIdentity(value: string) {
  return clean(value) || "未記入";
}

export function buildFeedbackBody(values: FeedbackFormValues) {
  return [
    "無料ツールの感想",
    "",
    "【使ったツール】",
    values.usedTools.join(" / "),
    "",
    "【どこまで進められましたか】",
    clean(values.progress),
    "",
    "【一番役立った項目】",
    clean(values.mostHelpful),
    "",
    "【入力に迷った項目、分かりにくかった部分】",
    fillOptional(values.confusingParts),
    "",
    "【次のツールに欲しい機能】",
    fillOptional(values.wantedFeatures),
    "",
    "【感想を今後の記事で紹介してよいか】",
    clean(values.publicationPermission),
    "",
    "【お名前・ハンドルネーム】",
    fillOptionalIdentity(values.name),
    "",
    "【返信先メールアドレス】",
    fillOptionalIdentity(values.email),
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
