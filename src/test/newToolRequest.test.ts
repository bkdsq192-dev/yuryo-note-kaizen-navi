import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import {
  NEW_TOOL_REQUEST_AI_DISSATISFACTION_NONE,
  NEW_TOOL_REQUEST_EMAIL,
  NEW_TOOL_REQUEST_SUBJECT,
  buildNewToolRequestBody,
  buildNewToolRequestGmailUrl,
  buildNewToolRequestMailtoUrl,
  validateNewToolRequest,
  type NewToolRequestValues,
} from "../newToolRequest";

function createValues(overrides: Partial<NewToolRequestValues> = {}): NewToolRequestValues {
  return {
    blocker: "テーマが決まらない",
    blockerOther: "",
    wantedFeatures: ["自分の経験・知識を棚卸しする機能", "見出し構成・記事の設計図を作る機能"],
    wantedFeaturesOther: "",
    aiDissatisfaction: ["内容が一般論になりやすい", "自分の経験がうまく入らない"],
    aiDissatisfactionOther: "",
    finalOutputs: ["note記事の設計図", "ChatGPTへ貼るプロンプト"],
    finalOutputsOther: "",
    freeComment: "質問に答えるだけで記事の骨組みが見えると助かります。",
    publicationPermission: "匿名なら紹介してよい",
    name: "",
    ...overrides,
  };
}

const documentExecCommandMock = vi.fn();

function loadNewToolRequestDom() {
  const html = readFileSync(resolve(process.cwd(), "public/new-tool-request.html"), "utf8");
  return new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://bkdsq192-dev.github.io/yuryo-note-kaizen-navi/new-tool-request.html",
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
}

describe("new tool request helpers", () => {
  test("必須項目が空だと日本語エラーになる", () => {
    const result = validateNewToolRequest(
      createValues({
        blocker: "",
        wantedFeatures: [],
        finalOutputs: [],
        publicationPermission: "",
      }),
    );

    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.blocker).toBe("noteを書くときに止まりやすいところを選択してください。");
    expect(result.fieldErrors.wantedFeatures).toBe("新ツールにあると助かる機能を1つ以上選択してください。");
    expect(result.fieldErrors.finalOutputs).toBe("新ツールで完成してほしいものを1つ以上選択してください。");
    expect(result.fieldErrors.publicationPermission).toBe("ご意見の掲載可否を選択してください。");
  });

  test("その他が選ばれていて空欄だとエラーになる", () => {
    const result = validateNewToolRequest(
      createValues({
        blocker: "その他",
        blockerOther: "",
        wantedFeatures: ["その他"],
        wantedFeaturesOther: "",
        aiDissatisfaction: ["その他"],
        aiDissatisfactionOther: "",
        finalOutputs: ["その他"],
        finalOutputsOther: "",
      }),
    );

    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.blockerOther).toBe("その他の内容を入力してください。");
    expect(result.fieldErrors.wantedFeaturesOther).toBe("その他の内容を入力してください。");
    expect(result.fieldErrors.aiDissatisfactionOther).toBe("その他の内容を入力してください。");
    expect(result.fieldErrors.finalOutputsOther).toBe("その他の内容を入力してください。");
  });

  test("複数選択が改行つき本文へ反映され、未定義文字列が出ない", () => {
    const body = buildNewToolRequestBody(
      createValues({
        wantedFeatures: ["自分の経験・知識を棚卸しする機能", "その他"],
        wantedFeaturesOther: "読者像の深掘り機能",
        finalOutputs: ["note記事の設計図", "X・Threads投稿文"],
        name: "",
      }),
    );

    expect(body).toContain("2．新ツールにあると助かる機能\n自分の経験・知識を棚卸しする機能\nその他：読者像の深掘り機能");
    expect(body).toContain("4．新ツールで最終的に完成してほしいもの\nnote記事の設計図\nX・Threads投稿文");
    expect(body).toContain("7．お名前・ハンドルネーム\n匿名");
    expect(body).not.toContain("undefined");
    expect(body).not.toContain("null");
    expect(body).not.toContain("[object Object]");
  });

  test("AI不満の排他選択が本文へ安全に反映される", () => {
    const body = buildNewToolRequestBody(
      createValues({
        aiDissatisfaction: [NEW_TOOL_REQUEST_AI_DISSATISFACTION_NONE, "その他"],
        aiDissatisfactionOther: "語尾が似通う",
        freeComment: "",
      }),
    );

    expect(body).toContain(`3．AIで文章を作ったときの不満\n${NEW_TOOL_REQUEST_AI_DISSATISFACTION_NONE}`);
    expect(body).toContain("5．自由意見\n特になし");
  });

  test("Gmail URL生成が動く", () => {
    const url = buildNewToolRequestGmailUrl(createValues());
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe("https://mail.google.com/mail/");
    expect(parsed.searchParams.get("to")).toBe(NEW_TOOL_REQUEST_EMAIL);
    expect(parsed.searchParams.get("su")).toBe(NEW_TOOL_REQUEST_SUBJECT);
    expect(parsed.searchParams.get("body")).toContain("1．noteを書くとき、一番止まりやすいところ");
  });

  test("mailto生成が動く", () => {
    const url = buildNewToolRequestMailtoUrl(createValues());

    expect(url.startsWith(`mailto:${NEW_TOOL_REQUEST_EMAIL}?`)).toBe(true);
    expect(decodeURIComponent(url)).toContain(`subject=${NEW_TOOL_REQUEST_SUBJECT}`);
    expect(decodeURIComponent(url)).toContain("6．意見の掲載可否");
  });
});

describe("new tool request page DOM", () => {
  test("ページタイトルが表示される", () => {
    const dom = loadNewToolRequestDom();
    const text = dom.window.document.body.textContent ?? "";

    expect(text).toContain("新ツールに欲しい機能を教えてください");
    expect(text).toContain("自分の経験や知識を、note記事の設計図に変えるツールを作っています");
  });

  test("質問1は単一選択で、その他選択時だけ入力欄が表示される", () => {
    const dom = loadNewToolRequestDom();
    const doc = dom.window.document;
    const radios = Array.from(doc.querySelectorAll('input[name="blocker"]')) as HTMLInputElement[];
    const first = doc.getElementById("blocker-1") as HTMLInputElement;
    const other = doc.getElementById("blocker-other-option") as HTMLInputElement;
    const wrap = doc.getElementById("blockerOtherWrap") as HTMLDivElement;

    expect(radios).toHaveLength(7);
    expect(wrap.classList.contains("is-visible")).toBe(false);
    first.click();
    other.click();
    expect(other.checked).toBe(true);
    expect(first.checked).toBe(false);
    expect(wrap.classList.contains("is-visible")).toBe(true);
  });

  test("質問2は複数選択でき、その他選択時に入力欄が表示される", () => {
    const dom = loadNewToolRequestDom();
    const doc = dom.window.document;
    const first = doc.getElementById("feature-1") as HTMLInputElement;
    const second = doc.getElementById("feature-2") as HTMLInputElement;
    const other = doc.getElementById("feature-other") as HTMLInputElement;
    const wrap = doc.getElementById("wantedFeaturesOtherWrap") as HTMLDivElement;

    first.click();
    second.click();
    expect(first.checked).toBe(true);
    expect(second.checked).toBe(true);
    other.click();
    expect(wrap.classList.contains("is-visible")).toBe(true);
  });

  test("質問3は特に不満はないと他項目が同時選択にならない", () => {
    const dom = loadNewToolRequestDom();
    const doc = dom.window.document;
    const none = doc.getElementById("dissatisfaction-none") as HTMLInputElement;
    const item = doc.getElementById("dissatisfaction-1") as HTMLInputElement;

    none.click();
    expect(none.checked).toBe(true);
    item.click();
    expect(item.checked).toBe(true);
    expect(none.checked).toBe(false);
    none.click();
    expect(none.checked).toBe(true);
    expect(item.checked).toBe(false);
  });

  test("質問4は複数選択でき、その他選択時に入力欄が表示される", () => {
    const dom = loadNewToolRequestDom();
    const doc = dom.window.document;
    const first = doc.getElementById("output-1") as HTMLInputElement;
    const second = doc.getElementById("output-2") as HTMLInputElement;
    const other = doc.getElementById("output-other") as HTMLInputElement;
    const wrap = doc.getElementById("finalOutputsOtherWrap") as HTMLDivElement;

    first.click();
    second.click();
    expect(first.checked).toBe(true);
    expect(second.checked).toBe(true);
    other.click();
    expect(wrap.classList.contains("is-visible")).toBe(true);
  });

  test("必須項目が空だとエラーが表示される", () => {
    const dom = loadNewToolRequestDom();
    const doc = dom.window.document;

    (doc.getElementById("gmailButton") as HTMLButtonElement).click();

    expect(doc.getElementById("blockerError")?.textContent).toContain("noteを書くときに止まりやすいところを選択してください。");
    expect(doc.getElementById("wantedFeaturesError")?.textContent).toContain("新ツールにあると助かる機能を1つ以上選択してください。");
    expect(doc.getElementById("finalOutputsError")?.textContent).toContain("新ツールで完成してほしいものを1つ以上選択してください。");
    expect(doc.getElementById("publicationPermissionError")?.textContent).toContain("ご意見の掲載可否を選択してください。");
  });

  test("その他が選ばれていて空欄だとエラーが表示される", () => {
    const dom = loadNewToolRequestDom();
    const doc = dom.window.document;

    (doc.getElementById("blocker-other-option") as HTMLInputElement).click();
    (doc.getElementById("feature-other") as HTMLInputElement).click();
    (doc.getElementById("output-other") as HTMLInputElement).click();
    (doc.getElementById("publication-ok") as HTMLInputElement).click();
    (doc.getElementById("gmailButton") as HTMLButtonElement).click();

    expect(doc.getElementById("blockerOtherError")?.textContent).toContain("その他の内容を入力してください。");
    expect(doc.getElementById("wantedFeaturesOtherError")?.textContent).toContain("その他の内容を入力してください。");
    expect(doc.getElementById("finalOutputsOtherError")?.textContent).toContain("その他の内容を入力してください。");
  });

  test("Gmail URLとcopy本文に選択結果が反映される", async () => {
    const dom = loadNewToolRequestDom();
    const doc = dom.window.document;
    const clipboard = dom.window.navigator.clipboard as { writeText: ReturnType<typeof vi.fn> };
    const openSpy = dom.window.open as unknown as ReturnType<typeof vi.fn>;

    (doc.getElementById("blocker-1") as HTMLInputElement).click();
    (doc.getElementById("feature-1") as HTMLInputElement).click();
    (doc.getElementById("feature-other") as HTMLInputElement).click();
    (doc.getElementById("wantedFeaturesOther") as HTMLInputElement).value = "プロンプトの調整補助";
    (doc.getElementById("wantedFeaturesOther") as HTMLInputElement).dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    (doc.getElementById("dissatisfaction-1") as HTMLInputElement).click();
    (doc.getElementById("dissatisfaction-other") as HTMLInputElement).click();
    (doc.getElementById("aiDissatisfactionOther") as HTMLInputElement).value = "体験談が薄くなる";
    (doc.getElementById("aiDissatisfactionOther") as HTMLInputElement).dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    (doc.getElementById("output-1") as HTMLInputElement).click();
    (doc.getElementById("output-other") as HTMLInputElement).click();
    (doc.getElementById("publication-ok") as HTMLInputElement).click();
    (doc.getElementById("finalOutputsOther") as HTMLInputElement).value = "チェックリスト";
    (doc.getElementById("freeComment") as HTMLTextAreaElement).value = "質問に答える順番が見えると助かります。";
    (doc.getElementById("name") as HTMLInputElement).value = "テスト太郎";

    (doc.getElementById("gmailButton") as HTMLButtonElement).click();
    const gmailUrl = openSpy.mock.calls.at(-1)?.[0] as string;
    const decodedGmailUrl = decodeURIComponent(gmailUrl);
    expect(decodedGmailUrl).toContain("2．新ツールにあると助かる機能\n自分の経験・知識を棚卸しする機能\nその他：プロンプトの調整補助");
    expect(decodedGmailUrl).toContain("3．AIで文章を作ったときの不満\n内容が一般論になりやすい\nその他：体験談が薄くなる");

    await (doc.getElementById("copyButton") as HTMLButtonElement).click();
    const copiedText = clipboard.writeText.mock.calls.at(-1)?.[0] as string;
    expect(copiedText).toContain("4．新ツールで最終的に完成してほしいもの\nnote記事の設計図\nその他：チェックリスト");
    expect(copiedText).toContain("7．お名前・ハンドルネーム\nテスト太郎");
    expect(copiedText).not.toContain("undefined");
    expect(copiedText).not.toContain("null");
    expect(copiedText).not.toContain("[object Object]");
  });

  test("メールアプリ送信ボタンは必須エラーなしで実行できる", () => {
    const dom = loadNewToolRequestDom();
    const doc = dom.window.document;
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      (doc.getElementById("blocker-1") as HTMLInputElement).click();
      (doc.getElementById("feature-1") as HTMLInputElement).click();
      (doc.getElementById("output-1") as HTMLInputElement).click();
      (doc.getElementById("publication-no") as HTMLInputElement).click();
      (doc.getElementById("mailtoButton") as HTMLButtonElement).click();

      expect(doc.getElementById("blockerError")?.textContent).toBe("");
      expect(doc.getElementById("wantedFeaturesError")?.textContent).toBe("");
      expect(doc.getElementById("finalOutputsError")?.textContent).toBe("");
      expect(doc.getElementById("publicationPermissionError")?.textContent).toBe("");
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
