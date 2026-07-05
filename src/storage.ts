import { STORAGE_KEY, STORAGE_VERSION, initialFormData } from "./data";
import type {
  CheckPriority,
  CheckStatus,
  FormData,
  PersistedData,
  PlanDay,
  PostStatus,
  PublishStatus,
  ReviewAnswer,
  SnsPost,
  StepId,
} from "./types";

const VALID_STEPS: StepId[] = ["basic", "title", "free", "paid", "sns", "plan", "summary"];
const VALID_REVIEW_STATUS: CheckStatus[] = ["", "clear", "partial", "missing"];
const VALID_REVIEW_PRIORITY: CheckPriority[] = ["", "high", "next", "later"];
const VALID_PUBLISH_STATUS: PublishStatus[] = ["", "before", "published"];
const VALID_POST_STATUS: PostStatus[] = ["todo", "drafting", "ready", "scheduled", "posted"];
const VALID_PLAN_STATUS: PlanDay["status"][] = ["todo", "doing", "done"];

export function loadSavedData(): PersistedData | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return parsePersistedValue(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveData(data: FormData, currentStep: StepId) {
  const payload: PersistedData = {
    version: STORAGE_VERSION,
    currentStep,
    data,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearSavedData() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function createFreshData(): FormData {
  return JSON.parse(JSON.stringify(initialFormData)) as FormData;
}

export function parseImportedData(text: string): PersistedData {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("JSONの形式が正しくありません。書き出したバックアップファイルを選んでください。");
  }

  const normalized = parsePersistedValue(parsed);
  if (!normalized) {
    throw new Error("このJSONは「有料note改善ナビ」のバックアップデータとして読み込めません。");
  }

  return normalized;
}

function parsePersistedValue(value: unknown): PersistedData | null {
  if (!isObject(value)) return null;
  if (value.version !== STORAGE_VERSION) return null;
  if (!VALID_STEPS.includes(value.currentStep as StepId)) return null;
  if (!isObject(value.data)) return null;

  return {
    version: STORAGE_VERSION,
    currentStep: value.currentStep as StepId,
    data: normalizeFormData(value.data),
  };
}

function normalizeFormData(value: Record<string, unknown>): FormData {
  const fresh = createFreshData();
  const basic = isObject(value.basic) ? value.basic : {};
  const title = isObject(value.title) ? value.title : {};
  const free = isObject(value.free) ? value.free : {};
  const freeBlocks = isObject(free.blocks) ? free.blocks : {};
  const paid = isObject(value.paid) ? value.paid : {};
  const paidBlocks = isObject(paid.blocks) ? paid.blocks : {};
  const sns = isObject(value.sns) ? value.sns : {};
  const plan = isObject(value.plan) ? value.plan : {};
  const reviews = isObject(value.reviews) ? value.reviews : {};

  return {
    basic: {
      publishStatus: normalizeEnum(basic.publishStatus, VALID_PUBLISH_STATUS, fresh.basic.publishStatus),
      currentTitle: normalizeString(basic.currentTitle),
      articleUrl: normalizeString(basic.articleUrl),
      price: normalizeString(basic.price),
      publishDate: normalizeString(basic.publishDate),
      daysSincePublish: normalizeString(basic.daysSincePublish),
      views: normalizeString(basic.views),
      likes: normalizeString(basic.likes),
      sales: normalizeString(basic.sales),
      targetReader: normalizeString(basic.targetReader),
      readerProblem: normalizeString(basic.readerProblem),
      goalAfterReading: normalizeString(basic.goalAfterReading),
      ownExperience: normalizeString(basic.ownExperience),
    },
    title: {
      keepElements: normalizeString(title.keepElements),
      missingElements: normalizeString(title.missingElements),
      titleIdeas: normalizeTitleIdeas(title.titleIdeas),
      finalTitle: normalizeString(title.finalTitle),
      finalTitleReason: normalizeString(title.finalTitleReason),
    },
    free: {
      blocks: Object.fromEntries(
        Object.keys(fresh.free.blocks).map((key) => {
          const block = isObject(freeBlocks[key]) ? freeBlocks[key] : {};
          return [
            key,
            {
              current: normalizeString(block.current),
              improved: normalizeString(block.improved),
            },
          ];
        }),
      ) as FormData["free"]["blocks"],
    },
    paid: {
      deliverables: normalizeStringArray(paid.deliverables),
      otherDeliverable: normalizeString(paid.otherDeliverable),
      blocks: Object.fromEntries(
        Object.keys(fresh.paid.blocks).map((key) => {
          const block = isObject(paidBlocks[key]) ? paidBlocks[key] : {};
          return [
            key,
            {
              content: normalizeString(block.content),
              outcome: normalizeString(block.outcome),
            },
          ];
        }),
      ) as FormData["paid"]["blocks"],
      productSummary: normalizeString(paid.productSummary),
    },
    sns: {
      posts: normalizePosts(sns.posts, fresh.sns.posts),
    },
    plan: {
      targetDate: normalizeString(plan.targetDate),
      dailyTime: normalizeDailyTime(plan.dailyTime, fresh.plan.dailyTime),
      focusArea: normalizeString(plan.focusArea),
      reviewMetrics: normalizeString(plan.reviewMetrics),
      days: normalizePlanDays(plan.days, fresh.plan.days),
    },
    reviews: Object.fromEntries(
      Object.keys(fresh.reviews).map((key) => {
        const review = isObject(reviews[key]) ? reviews[key] : {};
        return [Number(key), normalizeReview(review)];
      }),
    ) as FormData["reviews"],
    chosenPriorityIds: normalizeChosenPriorityIds(value.chosenPriorityIds),
    doNotChangeThisTime: normalizeString(value.doNotChangeThisTime),
  };
}

function normalizeTitleIdeas(value: unknown): [string, string, string] {
  if (!Array.isArray(value)) return ["", "", ""];
  return [normalizeString(value[0]), normalizeString(value[1]), normalizeString(value[2])];
}

function normalizePosts(value: unknown, fallback: SnsPost[]): SnsPost[] {
  if (!Array.isArray(value) || value.length !== fallback.length) {
    return JSON.parse(JSON.stringify(fallback)) as SnsPost[];
  }

  return value.map((item, index) => {
    const post = isObject(item) ? item : {};
    return {
      platform: fallback[index].platform,
      role: normalizeString(post.role) || fallback[index].role,
      text: normalizeString(post.text),
      noteUrl: normalizeString(post.noteUrl),
      postDate: normalizeString(post.postDate),
      postTime: normalizeString(post.postTime),
      imageName: normalizeString(post.imageName),
      status: normalizeEnum(post.status, VALID_POST_STATUS, fallback[index].status),
    };
  });
}

function normalizePlanDays(value: unknown, fallback: PlanDay[]): PlanDay[] {
  if (!Array.isArray(value) || value.length !== fallback.length) {
    return JSON.parse(JSON.stringify(fallback)) as PlanDay[];
  }

  return value.map((item, index) => {
    const day = isObject(item) ? item : {};
    return {
      day: typeof day.day === "number" && Number.isFinite(day.day) ? day.day : fallback[index].day,
      date: normalizeString(day.date),
      theme: normalizeString(day.theme) || fallback[index].theme,
      tasks: normalizeString(day.tasks),
      doneDefinition: normalizeString(day.doneDefinition),
      status: normalizeEnum(day.status, VALID_PLAN_STATUS, fallback[index].status),
    };
  });
}

function normalizeReview(value: Record<string, unknown>): ReviewAnswer {
  return {
    status: normalizeEnum(value.status, VALID_REVIEW_STATUS, ""),
    evidence: normalizeString(value.evidence),
    nextAction: normalizeString(value.nextAction),
    priority: normalizeEnum(value.priority, VALID_REVIEW_PRIORITY, ""),
  };
}

function normalizeChosenPriorityIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<number>();
  return value
    .map((item) => (typeof item === "number" && Number.isInteger(item) ? item : Number.NaN))
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= 20)
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .slice(0, 3);
}

function normalizeDailyTime(value: unknown, fallback: FormData["plan"]["dailyTime"]): FormData["plan"]["dailyTime"] {
  const valid: FormData["plan"]["dailyTime"][] = ["", "15", "30", "60", "90"];
  return normalizeEnum(value, valid, fallback);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
