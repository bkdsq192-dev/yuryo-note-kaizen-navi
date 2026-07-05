import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import {
  FEEDBACK_CONFUSING_NONE_OPTION,
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
    progress: "最後まで入力した",
    mostHelpful: "優先して直す3項目の決定",
    mostHelpfulOther: "",
    confusingParts: ["「根拠・現状」に何を書くか迷った", "優先して直す3項目の選び方に迷った"],
    confusingPartsOther: "",
    wantedFeatures: ["自分の経験・知識を棚卸しする機能", "見出し構成・記事の設計図を作る機能"],
    wantedFeaturesOther: "",
    comment: "記入例があったので、何を書けばよいか分かりました。",
    publicationPermission: "匿名なら掲載してよい",
    name: "",
    email: "",
    ...overrides,
  };
}

function loadFeedbackDom() {
  const html = readFileSync(resolve(process.cwd(), "public/feedback.html"), "utf8");
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://bkdsq192-dev.github.io/yuryo-note-kaizen-navi/feedback.html",
    beforeParse(window) {
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
      window.open = vi.fn();
      window.HTMLElement.prototype.focus = vi.fn();
      documentExecCommandMock.mockReturnValue(true);
      window.document.execCommand = documentExecCommandMock;
    },
  });

  return dom;
}

const documentExecCommandMock = vi.fn();

describe("feedback helpers", () => {
  test("既存の必須チェックと条件付きエラーが動く", () => {
    const result = validateFeedback(
      createValues({
        usedTools: [],
        progress: "",
        mostHelpful: "",
        publicationPermission: "匿名なら掲載してよい",
        comment: "   ",
      }),
    );

    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.usedTools).toBe("使ったツールを1つ以上選んでください。");
    expect(result.fieldErrors.progress).toBe("どこまで進められたかを選んでください。");
    expect(result.fieldErrors.mostHelpful).toBe("一番役立った項目を選んでください。");
    expect(result.fieldErrors.comment).toBe("記事で紹介できる感想を入力してください。");
  });

  test("その他の追加入力が必要な場合にエラーになる", () => {
    const result = validateFeedback(
      createValues({
        mostHelpful: "その他",
        mostHelpfulOther: "",
        confusingParts: ["その他"],
        confusingPartsOther: "",
        wantedFeatures: ["その他"],
        wantedFeaturesOther: "",
      }),
    );

    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.mostHelpfulOther).toBe("その他に役立った項目を入力してください。");
    expect(result.fieldErrors.confusingPartsOther).toBe("分かりにくかった部分を具体的に入力してください。");
    expect(result.fieldErrors.wantedFeaturesOther).toBe("次のツールに欲しい機能を入力してください。");
  });

  test("複数選択の結果が改行つき本文へ反映される", () => {
    const body = buildFeedbackBody(createValues());

    expect(body).toContain("無料ツール感想フォーム");
    expect(body).toContain("4．入力に迷った項目・分かりにくかった部分\n「根拠・現状」に何を書くか迷った\n優先して直す3項目の選び方に迷った");
    expect(body).toContain("5．次のツールに欲しい機能\n自分の経験・知識を棚卸しする機能\n見出し構成・記事の設計図を作る機能");
    expect(body).toContain("8．お名前・ハンドルネーム\n匿名");
    expect(body).not.toContain("undefined");
    expect(body).not.toContain("null");
    expect(body).not.toContain("[object Object]");
  });

  test("その他と特に迷わなかったを安全に本文化できる", () => {
    const body = buildFeedbackBody(
      createValues({
        mostHelpful: "その他",
        mostHelpfulOther: "個別の改善優先度の決め方",
        confusingParts: [FEEDBACK_CONFUSING_NONE_OPTION, "その他"],
        confusingPartsOther: "保存の場所が少し分かりにくかったです。",
        wantedFeatures: ["その他"],
        wantedFeaturesOther: "音声入力の整理機能",
        publicationPermission: "掲載しないでほしい",
        name: "",
      }),
    );

    expect(body).toContain("3．一番役立った項目\nその他：個別の改善優先度の決め方");
    expect(body).toContain(`4．入力に迷った項目・分かりにくかった部分\n${FEEDBACK_CONFUSING_NONE_OPTION}`);
    expect(body).toContain("5．次のツールに欲しい機能\nその他：音声入力の整理機能");
    expect(body).toContain("8．お名前・ハンドルネーム\n未記入");
  });

  test("Gmail URL生成が動く", () => {
    const url = buildFeedbackGmailUrl(createValues());
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe("https://mail.google.com/mail/");
    expect(parsed.searchParams.get("to")).toBe(FEEDBACK_EMAIL);
    expect(parsed.searchParams.get("su")).toBe(FEEDBACK_SUBJECT);
    expect(parsed.searchParams.get("body")).toContain("6．実際に使ってみた感想");
  });

  test("mailto生成が動く", () => {
    const url = buildFeedbackMailtoUrl(createValues());

    expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
    expect(decodeURIComponent(url)).toContain(`subject=${FEEDBACK_SUBJECT}`);
    expect(decodeURIComponent(url)).toContain("7．感想の掲載可否");
  });
});

describe("feedback page DOM", () => {
  test("質問番号が1〜9の順で表示される", () => {
    const dom = loadFeedbackDom();
    const text = dom.window.document.body.textContent ?? "";

    expect(text).toContain("1．どのツールを使いましたか？");
    expect(text).toContain("2．どこまで進められましたか？");
    expect(text).toContain("3．一番役立った項目を教えてください");
    expect(text).toContain("4．入力に迷った項目、分かりにくかった部分はありましたか？");
    expect(text).toContain("5．次のツールに欲しい機能を教えてください");
    expect(text).toContain("6．実際に使ってみた感想を、自由にお書きください");
    expect(text).toContain("7．感想を今後の記事で紹介してもよいですか？");
    expect(text).toContain("8．お名前・ハンドルネーム");
    expect(text).toContain("9．返信先メールアドレス");
  });

  test("質問3は通常6項目とその他の単一選択で、その他入力欄を切り替えられる", () => {
    const dom = loadFeedbackDom();
    const doc = dom.window.document;
    const radios = Array.from(doc.querySelectorAll('input[name="mostHelpful"]')) as HTMLInputElement[];
    const otherRadio = doc.getElementById("mostHelpfulOtherOption") as HTMLInputElement;
    const otherPanel = doc.getElementById("mostHelpfulOtherWrap") as HTMLDivElement;

    expect(radios).toHaveLength(7);
    expect(otherPanel.classList.contains("is-visible")).toBe(false);

    radios[0].click();
    otherRadio.click();
    expect(otherRadio.checked).toBe(true);
    expect(radios[0].checked).toBe(false);
    expect(otherPanel.classList.contains("is-visible")).toBe(true);
  });

  test("質問3のその他が空の場合にエラーになる", () => {
    const dom = loadFeedbackDom();
    const doc = dom.window.document;
    (doc.getElementById("tool-navi") as HTMLInputElement).click();
    (doc.getElementById("progress-complete") as HTMLInputElement).click();
    (doc.getElementById("mostHelpfulOtherOption") as HTMLInputElement).click();
    (doc.getElementById("permission-no") as HTMLInputElement).click();
    (doc.getElementById("gmailButton") as HTMLButtonElement).click();

    expect(doc.getElementById("mostHelpfulOtherError")?.textContent).toContain("その他に役立った項目を入力してください。");
  });

  test("質問4は複数選択でき、特に迷わなかったと他項目が同時選択にならない", () => {
    const dom = loadFeedbackDom();
    const doc = dom.window.document;
    const none = doc.getElementById("confusing-none") as HTMLInputElement;
    const item = doc.getElementById("confusing-1") as HTMLInputElement;

    none.click();
    expect(none.checked).toBe(true);
    item.click();
    expect(item.checked).toBe(true);
    expect(none.checked).toBe(false);
    none.click();
    expect(none.checked).toBe(true);
    expect(item.checked).toBe(false);
  });

  test("質問4のその他選択で入力欄が表示される", () => {
    const dom = loadFeedbackDom();
    const doc = dom.window.document;
    const other = doc.getElementById("confusing-other") as HTMLInputElement;
    const wrap = doc.getElementById("confusingOtherWrap") as HTMLDivElement;

    other.click();
    expect(wrap.classList.contains("is-visible")).toBe(true);
  });

  test("質問5は複数選択でき、その他選択で入力欄が表示される", () => {
    const dom = loadFeedbackDom();
    const doc = dom.window.document;
    const first = doc.getElementById("wanted-1") as HTMLInputElement;
    const second = doc.getElementById("wanted-2") as HTMLInputElement;
    const other = doc.getElementById("wanted-other") as HTMLInputElement;
    const wrap = doc.getElementById("wantedOtherWrap") as HTMLDivElement;

    first.click();
    second.click();
    expect(first.checked).toBe(true);
    expect(second.checked).toBe(true);
    other.click();
    expect(wrap.classList.contains("is-visible")).toBe(true);
  });

  test("感想欄は掲載不可なら空欄でも送信でき、掲載可なら空欄エラーになる", () => {
    const dom = loadFeedbackDom();
    const doc = dom.window.document;
    (doc.getElementById("tool-navi") as HTMLInputElement).click();
    (doc.getElementById("progress-complete") as HTMLInputElement).click();
    (doc.getElementById("most-helpful-5") as HTMLInputElement).click();
    (doc.getElementById("permission-no") as HTMLInputElement).click();
    (doc.getElementById("gmailButton") as HTMLButtonElement).click();
    expect(doc.getElementById("commentError")?.textContent).toBe("");

    (doc.getElementById("permission-ok") as HTMLInputElement).click();
    (doc.getElementById("gmailButton") as HTMLButtonElement).click();
    expect(doc.getElementById("commentError")?.textContent).toContain("記事で紹介できる感想を入力してください。");
  });

  test("入力した感想がコピー本文と既存送信機能へ反映される", async () => {
    const dom = loadFeedbackDom();
    const doc = dom.window.document;
    const clipboard = dom.window.navigator.clipboard as { writeText: ReturnType<typeof vi.fn> };
    const openSpy = dom.window.open as unknown as ReturnType<typeof vi.fn>;

    (doc.getElementById("tool-navi") as HTMLInputElement).click();
    (doc.getElementById("progress-complete") as HTMLInputElement).click();
    (doc.getElementById("most-helpful-5") as HTMLInputElement).click();
    (doc.getElementById("permission-ok") as HTMLInputElement).click();
    (doc.getElementById("comment") as HTMLTextAreaElement).value = "スマホでも使いやすかったです。";
    (doc.getElementById("comment") as HTMLTextAreaElement).dispatchEvent(new dom.window.Event("input", { bubbles: true }));

    (doc.getElementById("gmailButton") as HTMLButtonElement).click();
    const gmailUrl = openSpy.mock.calls[0][0] as string;
    expect(decodeURIComponent(gmailUrl)).toContain("スマホでも使いやすかったです。");

    await (doc.getElementById("copyButton") as HTMLButtonElement).click();
    expect(clipboard.writeText).toHaveBeenCalled();
    expect(clipboard.writeText.mock.calls.at(-1)?.[0]).toContain("6．実際に使ってみた感想\nスマホでも使いやすかったです。");
  });
});
