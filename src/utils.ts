import { FREE_BLOCKS, PAID_BLOCKS, PLAN_THEMES, REVIEW_ITEMS } from "./data";
import type { CheckStatus, FormData, PlanDay, ReviewMeta, ReviewAnswer } from "./types";

export function getStatusLabel(status: CheckStatus) {
  if (status === "clear") return "明確に書かれている";
  if (status === "partial") return "一部書かれている";
  if (status === "missing") return "まだ書かれていない";
  return "未回答";
}

export function getPriorityLabel(priority: ReviewAnswer["priority"]) {
  if (priority === "high") return "最優先";
  if (priority === "next") return "次に直す";
  if (priority === "later") return "今回は保留";
  return "未選択";
}

export function getPostStatusLabel(status: FormData["sns"]["posts"][number]["status"]) {
  return {
    todo: "未着手",
    drafting: "作成中",
    ready: "作成済み",
    scheduled: "予約済み",
    posted: "投稿済み",
  }[status];
}

export function getPlanStatusLabel(status: PlanDay["status"]) {
  return {
    todo: "未着手",
    doing: "進行中",
    done: "完了",
  }[status];
}

export function buildDesignSheetText(formData: FormData) {
  const priorityLines = getChosenPriorityItems(formData)
    .map(
      (item, index) =>
        `${index + 1}. ${item.meta.title}\n分野: ${getCategoryLabel(item.meta.category)}\n根拠・現状: ${item.answer.evidence || "未記入"}\n次に直すこと: ${item.answer.nextAction || "未記入"}`,
    )
    .join("\n\n");

  const freeBlocks = FREE_BLOCKS.map((block) => {
    const value = formData.free.blocks[block.key];
    return `【${block.label}】\n現在の内容: ${value.current || "未記入"}\n改善後の文章・要点: ${value.improved || "未記入"}`;
  }).join("\n\n");

  const paidBlocks = PAID_BLOCKS.map((block) => {
    const value = formData.paid.blocks[block.key];
    return `【${block.label}】\n入れる内容: ${value.content || "未記入"}\n購入者が完成させるもの: ${value.outcome || "未記入"}`;
  }).join("\n\n");

  const posts = formData.sns.posts
    .map(
      (post, index) =>
        `【投稿${index + 1} ${post.platform} / ${post.role}】\n投稿文: ${post.text || "未記入"}\nnote URL: ${post.noteUrl || "未記入"}\n投稿日: ${post.postDate || "未記入"}\n投稿時刻: ${post.postTime || "未記入"}\n画像名: ${post.imageName || "未記入"}\n状態: ${getPostStatusLabel(post.status)}`,
    )
    .join("\n\n");

  const planText = formData.plan.days
    .map(
      (day) =>
        `【${day.day}日目】\n日付: ${day.date || "未記入"}\n作業テーマ: ${day.theme || "未記入"}\n具体的にやること: ${day.tasks || "未記入"}\n完了条件: ${day.doneDefinition || "未記入"}\n状態: ${getPlanStatusLabel(day.status)}`,
    )
    .join("\n\n");

  return [
    "有料note改善ナビ 最終設計書",
    "",
    "【基本情報】",
    `現在のタイトル: ${formData.basic.currentTitle || "未記入"}`,
    `採用タイトル: ${formData.title.finalTitle || "未記入"}`,
    `届けたい読者: ${formData.basic.targetReader || "未記入"}`,
    `読者の悩み: ${formData.basic.readerProblem || "未記入"}`,
    `読後の到達点: ${formData.basic.goalAfterReading || "未記入"}`,
    "",
    "【商品を一文で説明した文章】",
    formData.paid.productSummary || "未記入",
    "",
    "【無料部分の5ブロック】",
    freeBlocks,
    "",
    "【有料部分の7ブロック】",
    paidBlocks,
    "",
    "【購入者へ渡すもの】",
    formData.paid.deliverables.length > 0 ? formData.paid.deliverables.join("、") : "未選択",
    formData.paid.otherDeliverable ? `その他: ${formData.paid.otherDeliverable}` : "",
    "",
    "【X投稿2本・Threads投稿2本】",
    posts,
    "",
    "【優先して直す3項目】",
    priorityLines || "未選択",
    "",
    "【今回あえて直さないこと】",
    formData.doNotChangeThisTime || "未記入",
    "",
    "【7日間改善計画】",
    planText,
  ]
    .filter(Boolean)
    .join("\n");
}

export function summarizeStatuses(formData: FormData) {
  const counts = { clear: 0, partial: 0, missing: 0, answered: 0 };
  for (const meta of REVIEW_ITEMS) {
    const status = formData.reviews[meta.id].status;
    if (status) {
      counts.answered += 1;
      counts[status] += 1;
    }
  }
  return counts;
}

export function summarizeByCategory(formData: FormData) {
  const categories: Record<ReviewMeta["category"], { clear: number; partial: number; missing: number }> = {
    title: { clear: 0, partial: 0, missing: 0 },
    free: { clear: 0, partial: 0, missing: 0 },
    paid: { clear: 0, partial: 0, missing: 0 },
    sns: { clear: 0, partial: 0, missing: 0 },
    plan: { clear: 0, partial: 0, missing: 0 },
  };

  for (const meta of REVIEW_ITEMS) {
    const status = formData.reviews[meta.id].status;
    if (status) {
      categories[meta.category][status] += 1;
    }
  }
  return categories;
}

export function getCategoryLabel(category: ReviewMeta["category"]) {
  return {
    title: "タイトル",
    free: "無料部分",
    paid: "有料部分",
    sns: "SNS導線",
    plan: "改善計画",
  }[category];
}

export function getChosenPriorityItems(formData: FormData) {
  return formData.chosenPriorityIds
    .map((id) => {
      const meta = REVIEW_ITEMS.find((item) => item.id === id);
      if (!meta) return null;
      return { meta, answer: formData.reviews[id] };
    })
    .filter((value): value is { meta: ReviewMeta; answer: ReviewAnswer } => value !== null);
}

export function getRecommendedPriorityIds(formData: FormData) {
  const highs = REVIEW_ITEMS.filter((item) => formData.reviews[item.id].priority === "high").map((item) => item.id);
  const nexts = REVIEW_ITEMS.filter((item) => formData.reviews[item.id].priority === "next").map((item) => item.id);
  return [...highs, ...nexts].slice(0, 3);
}

export function generatePlanDates(targetDate: string, days: PlanDay[]) {
  if (!targetDate) return days;

  const end = new Date(targetDate);
  if (Number.isNaN(end.getTime())) return days;

  let changed = false;
  const nextDays = days.map((day, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (6 - index));
    const iso = date.toISOString().slice(0, 10);
    const nextDate = day.date || iso;
    const nextTheme = day.theme || PLAN_THEMES[index];
    if (nextDate !== day.date || nextTheme !== day.theme) changed = true;
    return { ...day, date: nextDate, theme: nextTheme };
  });

  return changed ? nextDays : days;
}
