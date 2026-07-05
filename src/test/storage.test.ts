import { STORAGE_KEY, STORAGE_VERSION, sampleData } from "../data";
import { clearSavedData, createFreshData, loadSavedData, parseImportedData, saveData } from "../storage";
import type { FormData, PersistedData } from "../types";

function cloneSample(): FormData {
  return JSON.parse(JSON.stringify(sampleData)) as FormData;
}

describe("保存とJSON", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("入力変更後にlocalStorageへ保存される", () => {
    const data = cloneSample();
    saveData(data, "sns");
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).toContain('"currentStep":"sns"');
  });

  test("保存データから復元できる", () => {
    const data = cloneSample();
    saveData(data, "plan");
    expect(loadSavedData()?.data.basic.currentTitle).toBe(data.basic.currentTitle);
  });

  test("現在のステップが復元される", () => {
    saveData(cloneSample(), "summary");
    expect(loadSavedData()?.currentStep).toBe("summary");
  });

  test("不正な保存データはnullになりクラッシュしない", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-json");
    expect(loadSavedData()).toBeNull();
  });

  test("部分欠損の保存データは安全に正規化される", () => {
    const partial = {
      version: STORAGE_VERSION,
      currentStep: "title",
      data: {
        basic: { currentTitle: "途中データ" },
        title: { finalTitle: "採用タイトル" },
      },
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(partial));
    const loaded = loadSavedData();
    expect(loaded?.data.basic.currentTitle).toBe("途中データ");
    expect(loaded?.data.title.finalTitle).toBe("採用タイトル");
    expect(loaded?.data.plan.days).toHaveLength(7);
  });

  test("リセット用の削除関数で初期状態に戻せる", () => {
    saveData(cloneSample(), "basic");
    clearSavedData();
    expect(loadSavedData()).toBeNull();
    expect(createFreshData().basic.currentTitle).toBe("");
  });

  test("正常なJSONを読み込める", () => {
    const payload: PersistedData = {
      version: STORAGE_VERSION,
      currentStep: "paid",
      data: cloneSample(),
    };
    const imported = parseImportedData(JSON.stringify(payload));
    expect(imported.currentStep).toBe("paid");
    expect(imported.data.sns.posts).toHaveLength(4);
  });

  test("不正なJSONに日本語エラーを返す", () => {
    expect(() => parseImportedData("{"))
      .toThrow("JSONの形式が正しくありません。書き出したバックアップファイルを選んでください。");
  });

  test("バージョン違いのJSONを安全に弾く", () => {
    const payload = {
      version: STORAGE_VERSION + 1,
      currentStep: "basic",
      data: cloneSample(),
    };
    expect(() => parseImportedData(JSON.stringify(payload)))
      .toThrow("このJSONは「有料note改善ナビ」のバックアップデータとして読み込めません。");
  });
});
