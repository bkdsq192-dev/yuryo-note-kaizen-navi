import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "../App";
import { STORAGE_KEY, STORAGE_VERSION, sampleData } from "../data";
import type { FormData, PersistedData, StepId } from "../types";

type MockReadableFile = Blob & { __mockText?: string; text?: () => Promise<string> };

function cloneSample(): FormData {
  return JSON.parse(JSON.stringify(sampleData)) as FormData;
}

function makePriorityCase(exactHighIds: number[], nextIds: number[] = []): FormData {
  const data = cloneSample();
  for (const key of Object.keys(data.reviews)) {
    data.reviews[Number(key)].priority = "later";
  }
  for (const id of exactHighIds) data.reviews[id].priority = "high";
  for (const id of nextIds) data.reviews[id].priority = "next";
  data.chosenPriorityIds = exactHighIds.slice(0, 3);
  return data;
}

function saveState(step: StepId, data: FormData) {
  const payload: PersistedData = { version: STORAGE_VERSION, currentStep: step, data };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function renderWithState(step?: StepId, data?: FormData) {
  window.localStorage.clear();
  if (step && data) saveState(step, data);
  return render(<App />);
}

function createMockFile(text: string, name: string): File {
  const file = new File([text], name, { type: "application/json" }) as File & { __mockText?: string };
  file.__mockText = text;
  return file;
}

class MockFileReader {
  public result: string | ArrayBuffer | null = null;
  public onload: null | ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) = null;

  readAsText(file: Blob) {
    const readable = file as MockReadableFile;
    const loadText = typeof readable.text === "function"
      ? readable.text()
      : Promise.resolve(readable.__mockText ?? "");

    loadText.then((text) => {
      this.result = text;
      if (this.onload) {
        this.onload.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
      }
    });
  }
}

describe("App UI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    window.localStorage.clear();
    Object.defineProperty(window, "FileReader", {
      writable: true,
      value: MockFileReader,
    });
  });

  test("開始画面が表示される", () => {
    renderWithState();
    expect(screen.getByRole("heading", { name: "有料note改善ナビ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "最初から始める" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "記入例を読み込む" })).toBeInTheDocument();
  });

  test("保存データがあれば同じステップから復元される", () => {
    renderWithState("summary", cloneSample());
    expect(screen.getByText("今回の整理結果を1枚の設計書にまとめます")).toBeInTheDocument();
    expect(screen.getAllByText("結果まとめ").length).toBeGreaterThan(0);
  });

  test("不正な保存データでもクラッシュせず開始画面になる", () => {
    window.localStorage.setItem(STORAGE_KEY, "broken");
    render(<App />);
    expect(screen.getByRole("heading", { name: "有料note改善ナビ" })).toBeInTheDocument();
  });

  test("入力変更後に自動保存される", async () => {
    vi.useFakeTimers();
    renderWithState();
    fireEvent.click(screen.getByRole("button", { name: "最初から始める" }));
    fireEvent.click(screen.getByLabelText("公開前"));
    fireEvent.change(screen.getByLabelText("現在のタイトル"), { target: { value: "保存テスト用タイトル" } });
    fireEvent.change(screen.getByLabelText("販売価格"), { target: { value: "500" } });
    fireEvent.change(screen.getByLabelText("届けたい読者"), { target: { value: "読者A" } });
    fireEvent.change(screen.getByLabelText("読者が一番困っていること"), { target: { value: "悩みA" } });
    fireEvent.change(screen.getByLabelText("読後の到達点"), { target: { value: "到達点A" } });
    fireEvent.change(screen.getByLabelText("この記事に使っている自分の経験"), { target: { value: "経験A" } });

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toContain("保存テスト用タイトル");
    expect(raw).toContain('"currentStep":"basic"');
  });

  test("リセットで開始画面へ戻る", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderWithState("title", cloneSample());

    fireEvent.click(screen.getByRole("button", { name: /最初からやり直す/ }));

    expect(screen.getByRole("button", { name: "最初から始める" })).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("最優先が3件なら候補も3件になる", () => {
    renderWithState("summary", makePriorityCase([1, 3, 7]));
    const section = screen.getByRole("heading", { name: "優先して直す3項目" }).closest("section");
    expect(section).not.toBeNull();
    const checkboxes = within(section as HTMLElement).getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
  });

  test("最優先が4件以上なら3件まで選択できる", () => {
    const data = makePriorityCase([1, 3, 7, 8]);
    renderWithState("summary", data);

    const section = screen.getByRole("heading", { name: "優先して直す3項目" }).closest("section") as HTMLElement;
    const checkboxes = within(section).getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(4);
    fireEvent.click(checkboxes[3]);

    expect(screen.getByText("優先して直す項目は3件まで選べます。")).toBeInTheDocument();
    expect(within(section).getAllByText(/分野:/)).toHaveLength(3);
  });

  test("最優先が2件以下なら次に直すから補って3件選べる", () => {
    const data = makePriorityCase([1, 3], [4, 5]);
    data.chosenPriorityIds = [1, 3];
    renderWithState("summary", data);

    const section = screen.getByRole("heading", { name: "優先して直す3項目" }).closest("section") as HTMLElement;
    const checkboxes = within(section).getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(4);
    fireEvent.click(checkboxes[2]);
    expect(within(section).getAllByText(/分野:/)).toHaveLength(3);
  });

  test("選択した優先3項目の根拠と次に直すことが結果へ反映される", () => {
    renderWithState("summary", cloneSample());
    expect(screen.getAllByText(/50代会社員は分かるが、売れない人向けとは伝わりにくい/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/悩みがある人向けだと分かる語を入れる/).length).toBeGreaterThan(0);
  });

  test("販売予測や点数ラベルは表示されない", () => {
    renderWithState("summary", cloneSample());
    expect(screen.queryByText(/販売予測/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^点数[:：]/)).not.toBeInTheDocument();
  });

  test("JSONを書き出せる", async () => {
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { writable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { writable: true, value: revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    renderWithState("summary", cloneSample());

    fireEvent.click(screen.getAllByRole("button", { name: /JSONを書き出す/ })[0]);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.size).toBeGreaterThan(0);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  test("正常なJSONを読み込める", async () => {
    renderWithState();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const payload: PersistedData = { version: STORAGE_VERSION, currentStep: "summary", data: cloneSample() };
    const file = createMockFile(JSON.stringify(payload), "backup.json");

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("今回の整理結果を1枚の設計書にまとめます")).toBeInTheDocument();
    });
    expect(screen.getByText("JSONデータを読み込みました。")).toBeInTheDocument();
  });

  test("不正なJSONで日本語エラーを表示できる", async () => {
    renderWithState();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockFile("{", "broken.json");

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("JSONの形式が正しくありません。書き出したバックアップファイルを選んでください。")).toBeInTheDocument();
    });
  });

  test("記入例読み込み時の注意書きが表示される", () => {
    renderWithState();
    fireEvent.click(screen.getByRole("button", { name: "記入例を読み込む" }));
    expect(screen.getByText("この記入例は正解を示すものではありません。どの欄に、どの程度具体的に入力するかを理解するための参考例です。内容をご自身の有料noteへ置き換えてお使いください。")).toBeInTheDocument();
  });
});

