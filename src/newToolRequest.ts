export const NEW_TOOL_REQUEST_EMAIL = "bkdsq192@gmail.com";
export const NEW_TOOL_REQUEST_SUBJECT = "新ツールへの要望｜note記事設計ナビ";

export const NEW_TOOL_REQUEST_BLOCKER_OPTIONS = [
  "テーマが決まらない",
  "誰に向けて書くか決まらない",
  "自分の経験をどう使えばいいか分からない",
  "タイトルが作れない",
  "見出し構成が作れない",
  "ChatGPTに何を渡せばいいか分からない",
  "その他",
] as const;

export const NEW_TOOL_REQUEST_FEATURE_OPTIONS = [
  "自分の経験・知識を棚卸しする機能",
  "読者と悩みを整理する機能",
  "noteのタイトル案を作る機能",
  "見出し構成・記事の設計図を作る機能",
  "ChatGPTへ渡す原稿作成プロンプトを作る機能",
  "X・Threadsの投稿案を作る機能",
  "その他",
] as const;

export const NEW_TOOL_REQUEST_AI_DISSATISFACTION_OPTIONS = [
  "内容が一般論になりやすい",
  "自分の経験がうまく入らない",
  "文章がきれいすぎて自分らしくない",
  "誰向けの記事かぼやける",
  "タイトルや見出しが弱い",
  "最後の結論がまとまらない",
  "特に不満はない",
  "その他",
] as const;

export const NEW_TOOL_REQUEST_AI_DISSATISFACTION_NONE = "特に不満はない";

export const NEW_TOOL_REQUEST_OUTPUT_OPTIONS = [
  "note記事の設計図",
  "タイトル案",
  "見出し構成",
  "導入文の材料",
  "本文に入れる経験・数字の整理",
  "ChatGPTへ貼るプロンプト",
  "X・Threads投稿文",
  "その他",
] as const;

export const NEW_TOOL_REQUEST_PUBLICATION_OPTIONS = ["匿名なら紹介してよい", "紹介しないでほしい"] as const;

export interface NewToolRequestValues {
  blocker: string;
  blockerOther: string;
  wantedFeatures: string[];
  wantedFeaturesOther: string;
  aiDissatisfaction: string[];
  aiDissatisfactionOther: string;
  finalOutputs: string[];
  finalOutputsOther: string;
  freeComment: string;
  publicationPermission: string;
  name: string;
}

export interface NewToolRequestValidationResult {
  isValid: boolean;
  fieldErrors: Partial<
    Record<
      | "blocker"
      | "blockerOther"
      | "wantedFeatures"
      | "wantedFeaturesOther"
      | "aiDissatisfactionOther"
      | "finalOutputs"
      | "finalOutputsOther"
      | "publicationPermission",
      string
    >
  >;
}

function clean(value: string) {
  return value.trim();
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => clean(value)).filter(Boolean))];
}

function normalizeExclusiveOption(values: string[], exclusiveOption: string) {
  const normalized = unique(values);
  if (normalized.includes(exclusiveOption)) {
    return [exclusiveOption];
  }
  return normalized;
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

  if (normalized.length === 0) {
    return "特になし";
  }

  return toLineBlock(
    normalized.map((value) => {
      if (value === "その他") {
        return `その他：${clean(otherText) || "未記入"}`;
      }
      return value;
    }),
  );
}

function formatName(name: string) {
  return clean(name) || "匿名";
}

export function validateNewToolRequest(values: NewToolRequestValues): NewToolRequestValidationResult {
  const fieldErrors: NewToolRequestValidationResult["fieldErrors"] = {};

  if (!clean(values.blocker)) {
    fieldErrors.blocker = "noteを書くときに止まりやすいところを選択してください。";
  }

  if (values.blocker === "その他" && !clean(values.blockerOther)) {
    fieldErrors.blockerOther = "その他の内容を入力してください。";
  }

  if (unique(values.wantedFeatures).length === 0) {
    fieldErrors.wantedFeatures = "新ツールにあると助かる機能を1つ以上選択してください。";
  }

  if (unique(values.wantedFeatures).includes("その他") && !clean(values.wantedFeaturesOther)) {
    fieldErrors.wantedFeaturesOther = "その他の内容を入力してください。";
  }

  if (unique(values.aiDissatisfaction).includes("その他") && !clean(values.aiDissatisfactionOther)) {
    fieldErrors.aiDissatisfactionOther = "その他の内容を入力してください。";
  }

  if (unique(values.finalOutputs).length === 0) {
    fieldErrors.finalOutputs = "新ツールで完成してほしいものを1つ以上選択してください。";
  }

  if (unique(values.finalOutputs).includes("その他") && !clean(values.finalOutputsOther)) {
    fieldErrors.finalOutputsOther = "その他の内容を入力してください。";
  }

  if (!clean(values.publicationPermission)) {
    fieldErrors.publicationPermission = "ご意見の掲載可否を選択してください。";
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

export function buildNewToolRequestBody(values: NewToolRequestValues) {
  return [
    "新ツールへの要望フォーム",
    "",
    "1．noteを書くとき、一番止まりやすいところ",
    formatOtherAwareSingle(values.blocker, values.blockerOther),
    "",
    "2．新ツールにあると助かる機能",
    formatOtherAwareMultiple(values.wantedFeatures, values.wantedFeaturesOther),
    "",
    "3．AIで文章を作ったときの不満",
    formatOtherAwareMultiple(
      normalizeExclusiveOption(values.aiDissatisfaction, NEW_TOOL_REQUEST_AI_DISSATISFACTION_NONE),
      values.aiDissatisfactionOther,
      NEW_TOOL_REQUEST_AI_DISSATISFACTION_NONE,
    ),
    "",
    "4．新ツールで最終的に完成してほしいもの",
    formatOtherAwareMultiple(values.finalOutputs, values.finalOutputsOther),
    "",
    "5．自由意見",
    clean(values.freeComment) || "特になし",
    "",
    "6．意見の掲載可否",
    clean(values.publicationPermission) || "未記入",
    "",
    "7．お名前・ハンドルネーム",
    formatName(values.name),
  ].join("\n");
}

export function buildNewToolRequestGmailUrl(values: NewToolRequestValues) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: NEW_TOOL_REQUEST_EMAIL,
    su: NEW_TOOL_REQUEST_SUBJECT,
    body: buildNewToolRequestBody(values),
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function buildNewToolRequestMailtoUrl(values: NewToolRequestValues) {
  const params = new URLSearchParams({
    subject: NEW_TOOL_REQUEST_SUBJECT,
    body: buildNewToolRequestBody(values),
  });

  return `mailto:${NEW_TOOL_REQUEST_EMAIL}?${params.toString()}`;
}
