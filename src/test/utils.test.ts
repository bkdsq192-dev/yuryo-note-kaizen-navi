import { sampleData } from "../data";
import { buildDesignSheetText, getChosenPriorityItems, getRecommendedPriorityIds, summarizeByCategory, summarizeStatuses } from "../utils";
import type { FormData } from "../types";

function cloneSample(): FormData {
  return JSON.parse(JSON.stringify(sampleData)) as FormData;
}

describe("集計と設計書", () => {
  test("20項目すべてに回答すると回答済みが20件になる", () => {
    const counts = summarizeStatuses(cloneSample());
    expect(counts.answered).toBe(20);
  });

  test("3段階の状態件数が正しく集計される", () => {
    const counts = summarizeStatuses(cloneSample());
    expect(counts).toEqual({ clear: 9, partial: 10, missing: 1, answered: 20 });
  });

  test("分野別集計が正しい", () => {
    const categories = summarizeByCategory(cloneSample());
    expect(categories).toEqual({
      title: { clear: 1, partial: 2, missing: 1 },
      free: { clear: 2, partial: 2, missing: 0 },
      paid: { clear: 2, partial: 2, missing: 0 },
      sns: { clear: 2, partial: 2, missing: 0 },
      plan: { clear: 2, partial: 2, missing: 0 },
    });
  });

  test("最優先が3件の場合は3件が推奨される", () => {
    const data = cloneSample();
    for (const key of Object.keys(data.reviews)) {
      data.reviews[Number(key)].priority = "later";
    }
    data.reviews[1].priority = "high";
    data.reviews[3].priority = "high";
    data.reviews[7].priority = "high";
    const recommended = getRecommendedPriorityIds(data);
    expect(recommended).toEqual([1, 3, 7]);
  });

  test("最優先が2件以下の場合は次に直すから補われる", () => {
    const data = cloneSample();
    for (const key of Object.keys(data.reviews)) {
      data.reviews[Number(key)].priority = "later";
    }
    data.reviews[1].priority = "high";
    data.reviews[3].priority = "high";
    data.reviews[4].priority = "next";
    const recommended = getRecommendedPriorityIds(data);
    expect(recommended).toEqual([1, 3, 4]);
  });

  test("選択した優先3項目の内容が取得できる", () => {
    const items = getChosenPriorityItems(cloneSample());
    expect(items).toHaveLength(3);
    expect(items[0]?.meta.title).toBe("タイトルから対象読者が分かる");
    expect(items[0]?.answer.evidence).toContain("50代会社員");
    expect(items[0]?.answer.nextAction).toContain("悩み");
  });

  test("最終設計書に必要項目が入り、不要な値が出ない", () => {
    const text = buildDesignSheetText(cloneSample());
    expect(text).toContain("採用タイトル: 有料noteが売れない人へ タイトルと無料部分を整える原稿改善ワーク");
    expect(text).toContain("届けたい読者:");
    expect(text).toContain("読者の悩み:");
    expect(text).toContain("読後の到達点:");
    expect(text).toContain("【無料部分の5ブロック】");
    expect(text).toContain("【有料部分の7ブロック】");
    expect(text).toContain("【購入者へ渡すもの】");
    expect(text).toContain("【投稿1 X / 問題提起】");
    expect(text).toContain("【投稿3 Threads / 体験・失敗】");
    expect(text).toContain("【優先して直す3項目】");
    expect(text).toContain("【7日間改善計画】");
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
    expect(text).not.toContain("[object Object]");
  });
});
