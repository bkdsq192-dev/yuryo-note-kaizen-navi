export type StepId =
  | "basic"
  | "title"
  | "free"
  | "paid"
  | "sns"
  | "plan"
  | "summary";

export type CheckStatus = "" | "clear" | "partial" | "missing";
export type CheckPriority = "" | "high" | "next" | "later";
export type SaveState = "idle" | "saving" | "saved" | "error";
export type PublishStatus = "before" | "published" | "";
export type PostStatus = "todo" | "drafting" | "ready" | "scheduled" | "posted";
export type PostPlatform = "X" | "Threads";

export interface ReviewAnswer {
  status: CheckStatus;
  evidence: string;
  nextAction: string;
  priority: CheckPriority;
}

export interface BasicInfo {
  publishStatus: PublishStatus;
  currentTitle: string;
  articleUrl: string;
  price: string;
  publishDate: string;
  daysSincePublish: string;
  views: string;
  likes: string;
  sales: string;
  targetReader: string;
  readerProblem: string;
  goalAfterReading: string;
  ownExperience: string;
}

export interface TitleStepData {
  keepElements: string;
  missingElements: string;
  titleIdeas: [string, string, string];
  finalTitle: string;
  finalTitleReason: string;
}

export interface FreeBlock {
  current: string;
  improved: string;
}

export interface FreeStepData {
  blocks: Record<string, FreeBlock>;
}

export interface PaidStepData {
  deliverables: string[];
  otherDeliverable: string;
  blocks: Record<string, { content: string; outcome: string }>;
  productSummary: string;
}

export interface SnsPost {
  platform: PostPlatform;
  role: string;
  text: string;
  noteUrl: string;
  postDate: string;
  postTime: string;
  imageName: string;
  status: PostStatus;
}

export interface SnsStepData {
  posts: SnsPost[];
}

export interface PlanDay {
  day: number;
  date: string;
  theme: string;
  tasks: string;
  doneDefinition: string;
  status: "todo" | "doing" | "done";
}

export interface PlanStepData {
  targetDate: string;
  dailyTime: "" | "15" | "30" | "60" | "90";
  focusArea: string;
  reviewMetrics: string;
  days: PlanDay[];
}

export interface FormData {
  basic: BasicInfo;
  title: TitleStepData;
  free: FreeStepData;
  paid: PaidStepData;
  sns: SnsStepData;
  plan: PlanStepData;
  reviews: Record<number, ReviewAnswer>;
  chosenPriorityIds: number[];
  doNotChangeThisTime: string;
}

export interface PersistedData {
  version: number;
  currentStep: StepId;
  data: FormData;
}

export interface StepMeta {
  id: StepId;
  label: string;
  shortLabel: string;
  accent: string;
}

export interface ReviewMeta {
  id: number;
  category: "title" | "free" | "paid" | "sns" | "plan";
  title: string;
}
