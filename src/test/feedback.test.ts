import {
  FEEDBACK_EMAIL,
  FEEDBACK_SUBJECT,
  buildFeedbackBody,
  buildFeedbackGmailUrl,
  buildFeedbackMailtoUrl,
  validateFeedback,
  type FeedbackFormValues,
} from "../feedback";

function createValues(overrides: Partial<FeedbackFormValues> = {}): FeedbackFormValues {
  return {
    usedTools: ["有料note改善ナビ"],
    progress: "結果まとめ、最終設計書まで作成した",
    mostHelpful: "優先して直す3項目を整理できました。",
    confusingParts: "",
    wantedFeatures: "自分の経験から設計図を作る機能が欲しいです。",
    publicationPermission: "匿名なら掲載してよい",
    name: "bkdsq",
    email: "test@example.com",
    ...overrides,
  };
}

describe("feedback helpers", () => {
  test("必須項目が足りない場合に日本語エラーを返す", () => {
    const result = validateFeedback(
      createValues({
        usedTools: [],
        progress: "",
        mostHelpful: "   ",
        publicationPermission: "",
      }),
    );

    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.usedTools).toBe("使ったツールを1つ以上選んでください。");
    expect(result.fieldErrors.progress).toBe("どこまで進められたかを選んでください。");
    expect(result.fieldErrors.mostHelpful).toBe("一番役立った項目を入力してください。");
    expect(result.fieldErrors.publicationPermission).toBe("感想の掲載可否を選んでください。");
  });

  test("回答本文を見出し付きの日本語テキストで生成できる", () => {
    const body = buildFeedbackBody(
      createValues({
        usedTools: ["有料note改善・実践スプレッドシート", "有料note改善ナビ"],
        confusingParts: "",
        name: "",
        email: "",
      }),
    );

    expect(body).toContain("無料ツールの感想");
    expect(body).toContain("【使ったツール】\n有料note改善・実践スプレッドシート / 有料note改善ナビ");
    expect(body).toContain("【入力に迷った項目、分かりにくかった部分】\n特になし");
    expect(body).toContain("【お名前・ハンドルネーム】\n未記入");
    expect(body).not.toContain("undefined");
    expect(body).not.toContain("null");
    expect(body).not.toContain("[object Object]");
  });

  test("Gmail URLに宛先、件名、本文を入れられる", () => {
    const url = buildFeedbackGmailUrl(createValues());
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe("https://mail.google.com/mail/");
    expect(parsed.searchParams.get("to")).toBe(FEEDBACK_EMAIL);
    expect(parsed.searchParams.get("su")).toBe(FEEDBACK_SUBJECT);
    expect(parsed.searchParams.get("body")).toContain("【一番役立った項目】");
  });

  test("mailto URLに宛先、件名、本文を入れられる", () => {
    const url = buildFeedbackMailtoUrl(createValues());

    expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
    expect(decodeURIComponent(url)).toContain(`subject=${FEEDBACK_SUBJECT}`);
    expect(decodeURIComponent(url)).toContain("【感想を今後の記事で紹介してよいか】");
  });
});
