import type { FormData, ReviewMeta, StepMeta } from "./types";

export const STORAGE_KEY = "paid-note-kaizen-navi";
export const STORAGE_VERSION = 1;

export const STEP_LIST: StepMeta[] = [
  { id: "basic", label: "STEP1 基本情報", shortLabel: "基本情報", accent: "basic" },
  { id: "title", label: "STEP2 タイトル", shortLabel: "タイトル", accent: "title" },
  { id: "free", label: "STEP3 無料部分", shortLabel: "無料部分", accent: "free" },
  { id: "paid", label: "STEP4 有料部分", shortLabel: "有料部分", accent: "paid" },
  { id: "sns", label: "STEP5 X・Threads導線", shortLabel: "SNS導線", accent: "sns" },
  { id: "plan", label: "STEP6 7日間改善計画", shortLabel: "改善計画", accent: "plan" },
  { id: "summary", label: "結果まとめ", shortLabel: "まとめ", accent: "summary" },
];

export const REVIEW_ITEMS: ReviewMeta[] = [
  { id: 1, category: "title", title: "タイトルから対象読者が分かる" },
  { id: 2, category: "title", title: "悩み、失敗、困りごとのいずれかが具体的に示されている" },
  { id: 3, category: "title", title: "読後に何ができるか、何が手に入るかが分かる" },
  { id: 4, category: "title", title: "数字、期間、形式、具体語のいずれかが入り、抽象的すぎない" },
  { id: 5, category: "free", title: "冒頭で読者の悩みを提示している" },
  { id: 6, category: "free", title: "失敗、経験、実例、具体的な数字が入っている" },
  { id: 7, category: "free", title: "無料部分だけでは解決しない理由と、有料部分が必要な理由がある" },
  { id: 8, category: "free", title: "有料部分で受け取れる成果物や特典を、3つ以上具体的に示している" },
  { id: 9, category: "paid", title: "購入者が記入、選択、書き換えのいずれかを行うワークがある" },
  { id: 10, category: "paid", title: "記入例または改善前・改善後の具体例がある" },
  { id: 11, category: "paid", title: "タイトル案、構成案、投稿文、計画など、読後の完成物が明記されている" },
  { id: 12, category: "paid", title: "価格に対して、持ち帰れるシート、手順、特典などが具体的に見える" },
  { id: 13, category: "sns", title: "投稿を記事の告知だけで始めず、読者の問題提起から始めている" },
  { id: 14, category: "sns", title: "一般論だけではなく、自分の経験や失敗が入っている" },
  { id: 15, category: "sns", title: "記事を読むと何を確認・改善できるかが具体的に書かれている" },
  { id: 16, category: "sns", title: "URLの前に、悩み、体験、記事で得られることの関係がある" },
  { id: 17, category: "plan", title: "最優先、次に直す、今回は保留を区別している" },
  { id: 18, category: "plan", title: "使える時間の範囲に収まる作業へ分けている" },
  { id: 19, category: "plan", title: "公開日または再公開日と各作業日が決まっている" },
  { id: 20, category: "plan", title: "公開後に確認する項目が決まっている" },
];

export const DELIVERABLE_OPTIONS = [
  "診断・確認シート",
  "チェックリスト",
  "テンプレート",
  "記入例",
  "改善前・改善後の例",
  "プロンプト",
  "7日間計画",
  "Web特典ツール",
  "その他",
];

export const FREE_BLOCKS = [
  { key: "readerProblem", label: "1. 読者の悩み" },
  { key: "ownFailure", label: "2. 自分の失敗・経験" },
  { key: "whyFailed", label: "3. なぜうまくいかなかったか" },
  { key: "paidSolution", label: "4. 有料部分で解決する内容" },
  { key: "afterPurchase", label: "5. 購入後にできること" },
];

export const PAID_BLOCKS = [
  { key: "currentState", label: "1. 現状整理" },
  { key: "titleImprove", label: "2. タイトル改善" },
  { key: "freeImprove", label: "3. 無料部分の見直し" },
  { key: "paidDesign", label: "4. 有料部分の設計" },
  { key: "snsGuide", label: "5. X・Threads導線" },
  { key: "weekPlan", label: "6. 7日間改善計画" },
  { key: "finalCheck", label: "7. 最終チェック" },
];

export const PLAN_THEMES = [
  "読者と悩みを整理する",
  "タイトルを3案作る",
  "無料部分を見直す",
  "有料部分で渡すものを決める",
  "記入例と特典を整える",
  "X・Threads投稿を作る",
  "最終確認して公開する",
];

function createEmptyReviews(): FormData["reviews"] {
  return Object.fromEntries(
    REVIEW_ITEMS.map((item) => [item.id, { status: "", evidence: "", nextAction: "", priority: "" }]),
  ) as FormData["reviews"];
}

function createEmptyPlanDays(): FormData["plan"]["days"] {
  return PLAN_THEMES.map((theme, index) => ({
    day: index + 1,
    date: "",
    theme,
    tasks: "",
    doneDefinition: "",
    status: "todo",
  }));
}

export const initialFormData: FormData = {
  basic: {
    publishStatus: "",
    currentTitle: "",
    articleUrl: "",
    price: "",
    publishDate: "",
    daysSincePublish: "",
    views: "",
    likes: "",
    sales: "",
    targetReader: "",
    readerProblem: "",
    goalAfterReading: "",
    ownExperience: "",
  },
  title: {
    keepElements: "",
    missingElements: "",
    titleIdeas: ["", "", ""],
    finalTitle: "",
    finalTitleReason: "",
  },
  free: {
    blocks: Object.fromEntries(FREE_BLOCKS.map((block) => [block.key, { current: "", improved: "" }])) as FormData["free"]["blocks"],
  },
  paid: {
    deliverables: [],
    otherDeliverable: "",
    blocks: Object.fromEntries(PAID_BLOCKS.map((block) => [block.key, { content: "", outcome: "" }])) as FormData["paid"]["blocks"],
    productSummary: "",
  },
  sns: {
    posts: [
      { platform: "X", role: "問題提起", text: "", noteUrl: "", postDate: "", postTime: "", imageName: "", status: "todo" },
      { platform: "X", role: "学び・記事紹介", text: "", noteUrl: "", postDate: "", postTime: "", imageName: "", status: "todo" },
      { platform: "Threads", role: "体験・失敗", text: "", noteUrl: "", postDate: "", postTime: "", imageName: "", status: "todo" },
      { platform: "Threads", role: "改善過程・記事紹介", text: "", noteUrl: "", postDate: "", postTime: "", imageName: "", status: "todo" },
    ],
  },
  plan: {
    targetDate: "",
    dailyTime: "",
    focusArea: "",
    reviewMetrics: "",
    days: createEmptyPlanDays(),
  },
  reviews: createEmptyReviews(),
  chosenPriorityIds: [],
  doNotChangeThisTime: "",
};

export const sampleData: FormData = {
  ...initialFormData,
  basic: {
    publishStatus: "published",
    currentTitle: "50代会社員がAIで稼ぐ前に作るべき、売れる原稿の芯",
    articleUrl: "https://note.com/sample/n/note-kaizen",
    price: "500",
    publishDate: "2026-06-25",
    daysSincePublish: "10",
    views: "236",
    likes: "4",
    sales: "0",
    targetReader: "有料noteを出したが売れず、何を直せばよいか分からない人",
    readerProblem: "タイトル、無料部分、有料部分、SNS導線のどこを直せばよいか分からない",
    goalAfterReading: "優先して直す3項目と、7日間の改善計画を作れる",
    ownExperience: "無料記事を5本公開した後、500円の有料noteを出した。スキは4件ついたが、公開後10日間の販売数は0件だった。",
  },
  title: {
    keepElements: "50代会社員、AI、売れる原稿という要素",
    missingElements: "誰のどんな悩みを解決するのか、読後に何が決まるのか",
    titleIdeas: [
      "有料noteが売れない50代会社員へ AIで原稿の芯を整える見直し手順",
      "有料noteが売れない人へ タイトルと無料部分を整える原稿改善ワーク",
      "AIで有料noteを改善したい人へ 売れない原因を整理する原稿設計シート",
    ],
    finalTitle: "有料noteが売れない人へ タイトルと無料部分を整える原稿改善ワーク",
    finalTitleReason: "悩みと改善対象が先に伝わり、実践型の内容だと分かるから",
  },
  free: {
    blocks: {
      readerProblem: { current: "有料noteを書いたけれど、反応が少ないと悩んでいる方向けです。", improved: "有料noteを公開したのに売れず、どこを直せばよいか分からない人へ向けて書いています。" },
      ownFailure: { current: "自分も最初は反応が伸びませんでした。", improved: "私も500円の有料noteを出した直後、10日間販売0件のまま止まりました。" },
      whyFailed: { current: "原因はタイトルや見せ方にありました。", improved: "タイトルが抽象的で、無料部分だけでは有料部分の価値が見えにくかったのが原因でした。" },
      paidSolution: { current: "有料部分では改善方法を紹介します。", improved: "有料部分では、タイトル再設計シート、無料部分の改善例、SNS導線の作り方を順番に整理します。" },
      afterPurchase: { current: "改善のヒントが得られます。", improved: "購入後は、優先して直す3項目と7日間の改善計画まで決められます。" },
    },
  },
  paid: {
    deliverables: ["診断・確認シート", "チェックリスト", "記入例", "7日間計画", "Web特典ツール"],
    otherDeliverable: "",
    blocks: {
      currentState: { content: "現状の反応数と課題を書き出す", outcome: "改善前の状態が1枚で見える" },
      titleImprove: { content: "タイトル案を3本作り比較する", outcome: "採用タイトルが決まる" },
      freeImprove: { content: "無料部分の5ブロックを書き直す", outcome: "無料部分の構成案ができる" },
      paidDesign: { content: "渡す成果物と有料部分の順番を整理する", outcome: "有料部分の設計書ができる" },
      snsGuide: { content: "XとThreadsの投稿文を4本作る", outcome: "投稿下書きがそろう" },
      weekPlan: { content: "7日間で直す順番を決める", outcome: "改善計画が完成する" },
      finalCheck: { content: "20項目で見直す", outcome: "公開前の最終確認ができる" },
    },
    productSummary: "有料noteを出したものの売れず、何を直せばよいか分からない人が、解説と実践シートを使って、タイトル・無料部分・有料部分・SNS導線を順番に見直し、次の7日間で改善案を完成させる実践型ワークです。",
  },
  sns: {
    posts: [
      { platform: "X", role: "問題提起", text: "有料noteが売れないとき、原因を一気に増やしすぎると手が止まります。まずはタイトル、無料部分、有料部分、SNS導線のどこが曖昧かを切り分けるのが近道でした。", noteUrl: "https://note.com/sample/n/note-kaizen", postDate: "2026-07-06", postTime: "07:30", imageName: "note-kaizen-01.png", status: "ready" },
      { platform: "X", role: "学び・記事紹介", text: "売れない原因を感覚で探すのをやめて、20項目で自己点検したら改善の順番が見えました。タイトルと無料部分を見直した流れを記事にまとめています。", noteUrl: "https://note.com/sample/n/note-kaizen", postDate: "2026-07-08", postTime: "07:45", imageName: "note-kaizen-02.png", status: "drafting" },
      { platform: "Threads", role: "体験・失敗", text: "500円の有料noteを出したのに10日間販売0件。内容より先に、無料部分で何が手に入るかを出せていなかったのが痛かったです。", noteUrl: "https://note.com/sample/n/note-kaizen", postDate: "2026-07-07", postTime: "12:30", imageName: "note-kaizen-03.png", status: "ready" },
      { platform: "Threads", role: "改善過程・記事紹介", text: "タイトル案を3本並べてみると、抽象語を減らすだけでも反応の違いを想像しやすくなりました。改善の手順を記事に整理しています。", noteUrl: "https://note.com/sample/n/note-kaizen", postDate: "2026-07-09", postTime: "12:00", imageName: "note-kaizen-04.png", status: "todo" },
    ],
  },
  plan: {
    targetDate: "2026-07-11",
    dailyTime: "30",
    focusArea: "無料部分",
    reviewMetrics: "公開後は閲覧数、スキ数、販売数、Xの保存数、Threadsの反応を確認する。",
    days: [
      { day: 1, date: "2026-07-05", theme: PLAN_THEMES[0], tasks: "読者像と悩みを1文で言い切る", doneDefinition: "読者と悩みが言い切れている", status: "done" },
      { day: 2, date: "2026-07-06", theme: PLAN_THEMES[1], tasks: "タイトル案を3本作る", doneDefinition: "比較できる3案が並んでいる", status: "doing" },
      { day: 3, date: "2026-07-07", theme: PLAN_THEMES[2], tasks: "無料部分の5ブロックを見直す", doneDefinition: "改善後の文章が5ブロック分ある", status: "todo" },
      { day: 4, date: "2026-07-08", theme: PLAN_THEMES[3], tasks: "有料部分の成果物を明確にする", doneDefinition: "渡すものが一覧化されている", status: "todo" },
      { day: 5, date: "2026-07-09", theme: PLAN_THEMES[4], tasks: "記入例とWeb特典の案内を整える", doneDefinition: "購入後の流れが説明できる", status: "todo" },
      { day: 6, date: "2026-07-10", theme: PLAN_THEMES[5], tasks: "XとThreadsの投稿文を整える", doneDefinition: "4投稿の下書きがそろう", status: "todo" },
      { day: 7, date: "2026-07-11", theme: PLAN_THEMES[6], tasks: "全体を見直して再公開する", doneDefinition: "公開前の確認が終わっている", status: "todo" },
    ],
  },
  reviews: {
    1: { status: "partial", evidence: "50代会社員は分かるが、売れない人向けとは伝わりにくい", nextAction: "悩みがある人向けだと分かる語を入れる", priority: "high" },
    2: { status: "partial", evidence: "AIで稼ぐ前という表現はあるが、困りごとが弱い", nextAction: "売れない、直せないなどの悩みを入れる", priority: "high" },
    3: { status: "missing", evidence: "読後に何が決まるかはタイトルだけで伝わらない", nextAction: "改善ワークや設計ができると明記する", priority: "high" },
    4: { status: "clear", evidence: "50代、AIなど具体語は入っている", nextAction: "抽象語を減らしつつ残す", priority: "next" },
    5: { status: "clear", evidence: "冒頭で売れずに困っている人向けだと書けている", nextAction: "導入1文を短く整える", priority: "next" },
    6: { status: "clear", evidence: "販売0件、500円、10日間の数字を出している", nextAction: "失敗の背景を1文足す", priority: "next" },
    7: { status: "partial", evidence: "有料部分の必要性は書いているが、無料では足りない理由が弱い", nextAction: "無料部分で止まる理由を追記する", priority: "high" },
    8: { status: "partial", evidence: "成果物は書いているが3つ以上の見せ方が不足", nextAction: "成果物を箇条書きで3つ以上示す", priority: "high" },
    9: { status: "clear", evidence: "記入と選択のワークがある", nextAction: "各ワークの完成イメージを添える", priority: "next" },
    10: { status: "partial", evidence: "記入例はあるが改善前後の比較が少ない", nextAction: "比較例を1セット追加する", priority: "next" },
    11: { status: "clear", evidence: "タイトル案、構成案、投稿文、計画が成果物としてある", nextAction: "一覧で見えるようにする", priority: "next" },
    12: { status: "partial", evidence: "持ち帰れるものの説明がやや散らばっている", nextAction: "特典一覧を冒頭で見せる", priority: "high" },
    13: { status: "clear", evidence: "X投稿1は問題提起から始まっている", nextAction: "残り投稿も同じ流れでそろえる", priority: "next" },
    14: { status: "clear", evidence: "販売0件の体験を投稿に入れている", nextAction: "失敗から学びへの接続を強める", priority: "next" },
    15: { status: "partial", evidence: "改善できる内容は書いているが、確認できる項目がやや抽象的", nextAction: "タイトルと無料部分を見直せると明記する", priority: "next" },
    16: { status: "partial", evidence: "URL前のつながりが弱い投稿がある", nextAction: "悩み→体験→得られること→URLの順に整える", priority: "high" },
    17: { status: "clear", evidence: "最優先と次に直すを分けている", nextAction: "保留項目も明示する", priority: "next" },
    18: { status: "partial", evidence: "30分でできる粒度にまだばらつきがある", nextAction: "各日の作業量を1タスクずつに絞る", priority: "high" },
    19: { status: "clear", evidence: "公開日と7日分の日付を設定できている", nextAction: "再公開日も見直す", priority: "next" },
    20: { status: "partial", evidence: "確認指標は書いているが、どの日に見るかが未定", nextAction: "公開後チェック日を追記する", priority: "next" },
  },
  chosenPriorityIds: [1, 3, 7],
  doNotChangeThisTime: "作業を広げすぎないため、今回はタイトルの方向性、画像、投稿時間は大きく変更せず、無料部分の具体性と有料部分の成果物を優先する。",
};
