import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ClipboardCopy,
  Download,
  FileUp,
  Save,
  Trash2,
} from "lucide-react";
import {
  DELIVERABLE_OPTIONS,
  FREE_BLOCKS,
  PAID_BLOCKS,
  REVIEW_ITEMS,
  STEP_LIST,
  STORAGE_VERSION,
  sampleData,
} from "./data";
import { clearSavedData, createFreshData, loadSavedData, parseImportedData, saveData } from "./storage";
import type { FormData, PlanDay, ReviewAnswer, SaveState, StepId } from "./types";
import {
  buildDesignSheetText,
  generatePlanDates,
  getCategoryLabel,
  getChosenPriorityItems,
  getPriorityLabel,
  getRecommendedPriorityIds,
  summarizeByCategory,
  summarizeStatuses,
} from "./utils";

type ErrorMap = Record<string, string>;

const NOTE_TEXT =
  "このツールは、販売数や売上を保証するものではありません。有料noteの設計で、明確になっている部分と、まだ整理できていない部分を確認し、次に行う作業を決めるための自己点検ツールです。";

const SAMPLE_NOTICE_TEXT =
  "この記入例は正解を示すものではありません。どの欄に、どの程度具体的に入力するかを理解するための参考例です。内容をご自身の有料noteへ置き換えてお使いください。";

function App() {
  const persistedAtLoad = loadSavedData();
  const [formData, setFormData] = useState<FormData>(() => persistedAtLoad?.data ?? createFreshData());
  const [currentStep, setCurrentStep] = useState<StepId>(() => persistedAtLoad?.currentStep ?? "basic");
  const [mode, setMode] = useState<"start" | "wizard">(persistedAtLoad ? "wizard" : "start");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [globalMessage, setGlobalMessage] = useState("");
  const [showSampleNotice, setShowSampleNotice] = useState(false);
  const [errors, setErrors] = useState<ErrorMap>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const visibleSteps = STEP_LIST.filter((step) => step.id !== "summary");
  const currentIndex = STEP_LIST.findIndex((step) => step.id === currentStep);
  const progress = currentStep === "summary" ? 100 : Math.round(((currentIndex + 1) / visibleSteps.length) * 100);
  const summaryCounts = summarizeStatuses(formData);
  const categoryCounts = summarizeByCategory(formData);
  const finalDesignText = useMemo(() => buildDesignSheetText(formData), [formData]);
  const chosenPriorityItems = getChosenPriorityItems(formData);

  useEffect(() => {
    if (mode !== "wizard") return;

    setSaveState("saving");
    const timer = window.setTimeout(() => {
      try {
        saveData(formData, currentStep);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [formData, currentStep, mode]);

  useEffect(() => {
    if (mode !== "wizard") return;

    setFormData((previous) => {
      const days = generatePlanDates(previous.plan.targetDate, previous.plan.days);
      if (days === previous.plan.days) return previous;
      return {
        ...previous,
        plan: {
          ...previous.plan,
          days,
        },
      };
    });
  }, [formData.plan.targetDate, mode]);

  useEffect(() => {
    const recommended = getRecommendedPriorityIds(formData);
    setFormData((previous) => {
      if (previous.chosenPriorityIds.length > 0 || recommended.length === 0) return previous;
      return { ...previous, chosenPriorityIds: recommended };
    });
  }, [formData]);

  function updateFormData(updater: (previous: FormData) => FormData) {
    setFormData((previous) => updater(previous));
    setGlobalMessage("");
  }

  function startFresh() {
    setFormData(createFreshData());
    setCurrentStep("basic");
    setErrors({});
    setMode("wizard");
    setShowSampleNotice(false);
    setGlobalMessage("");
  }

  function startSample() {
    setFormData(JSON.parse(JSON.stringify(sampleData)) as FormData);
    setCurrentStep("basic");
    setErrors({});
    setMode("wizard");
    setShowSampleNotice(true);
    setGlobalMessage("記入例を読み込みました。");
  }
  function continueSaved() {
    const loaded = loadSavedData();
    if (!loaded) {
      setGlobalMessage("続きデータが見つからなかったため、新しく開始してください。");
      return;
    }
    setFormData(loaded.data);
    setCurrentStep(loaded.currentStep);
    setErrors({});
    setShowSampleNotice(false);
    setMode("wizard");
  }

  function goToStep(step: StepId) {
    setCurrentStep(step);
    setErrors({});
  }

  function nextStep() {
    const nextErrors = validateStep(currentStep, formData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setGlobalMessage("未入力の項目があります。分かる範囲からで大丈夫なので、必要な欄を埋めてください。");
      return;
    }

    setGlobalMessage("");
    if (currentStep === "plan") {
      setCurrentStep("summary");
      return;
    }

    const next = STEP_LIST[currentIndex + 1];
    if (next) setCurrentStep(next.id);
  }

  function prevStep() {
    if (currentStep === "summary") {
      setCurrentStep("plan");
      return;
    }
    const prev = STEP_LIST[currentIndex - 1];
    if (prev) setCurrentStep(prev.id);
  }

  async function copyDesignSheet() {
    try {
      await navigator.clipboard.writeText(finalDesignText);
      setGlobalMessage("設計書をコピーしました。");
    } catch {
      setGlobalMessage("コピーに失敗しました。ブラウザの権限をご確認ください。");
    }
  }

  function exportJson() {
    const payload = { version: STORAGE_VERSION, currentStep, data: formData };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "paid-note-kaizen-navi-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setGlobalMessage("JSONを書き出しました。");
  }

  function handleJsonImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === "string" ? reader.result : "";
        const imported = parseImportedData(text);
        setFormData(imported.data);
        setCurrentStep(imported.currentStep);
        setMode("wizard");
        setShowSampleNotice(false);
        setErrors({});
        setGlobalMessage("JSONデータを読み込みました。");
      } catch (error) {
        setGlobalMessage(error instanceof Error ? error.message : "JSONの読み込みに失敗しました。");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function resetAll() {
    const ok = window.confirm("保存中の内容をすべて削除して最初からやり直しますか？");
    if (!ok) return;

    clearSavedData();
    setFormData(createFreshData());
    setCurrentStep("basic");
    setErrors({});
    setShowSampleNotice(false);
    setMode("start");
    setGlobalMessage("入力内容を削除しました。");
  }

  function toggleDeliverable(item: string) {
    updateFormData((previous) => {
      const exists = previous.paid.deliverables.includes(item);
      return {
        ...previous,
        paid: {
          ...previous.paid,
          deliverables: exists
            ? previous.paid.deliverables.filter((value) => value !== item)
            : [...previous.paid.deliverables, item],
        },
      };
    });
  }

  function updateReviewAnswer(id: number, key: keyof ReviewAnswer, value: string) {
    updateFormData((previous) => ({
      ...previous,
      reviews: {
        ...previous.reviews,
        [id]: {
          ...previous.reviews[id],
          [key]: value,
        },
      },
    }));
  }

  function toggleChosenPriority(id: number) {
    updateFormData((previous) => {
      const already = previous.chosenPriorityIds.includes(id);
      if (already) {
        return {
          ...previous,
          chosenPriorityIds: previous.chosenPriorityIds.filter((value) => value !== id),
        };
      }
      if (previous.chosenPriorityIds.length >= 3) {
        setGlobalMessage("優先して直す項目は3件まで選べます。");
        return previous;
      }
      return {
        ...previous,
        chosenPriorityIds: [...previous.chosenPriorityIds, id],
      };
    });
  }

  const stepCompletion = {
    basic: Object.keys(validateStep("basic", formData)).length === 0,
    title: Object.keys(validateStep("title", formData)).length === 0,
    free: Object.keys(validateStep("free", formData)).length === 0,
    paid: Object.keys(validateStep("paid", formData)).length === 0,
    sns: Object.keys(validateStep("sns", formData)).length === 0,
    plan: Object.keys(validateStep("plan", formData)).length === 0,
  };

  if (mode === "start") {
    const hasSaved = Boolean(loadSavedData());
    return (
      <div className="app-shell start-shell">
        <input ref={fileInputRef} type="file" accept="application/json" className="visually-hidden" onChange={handleJsonImport} />
        <main className="start-card">
          <div className="hero-badge">購入者特典ツール</div>
          <h1>有料note改善ナビ</h1>
          <p className="subtitle">質問に答えながら、次の1本を順番に整理する</p>
          <p className="lead">タイトル・無料部分・有料部分・SNS導線を順番に見直し、次の7日間で行う作業を整理します。</p>
          <div className="notice-card"><AlertCircle size={20} /><div><strong>自己点検ツールです</strong><p>{NOTE_TEXT}</p></div></div>
          <div className="privacy-card"><p>入力内容は、この端末のブラウザ内にだけ保存されます。外部サーバーには送信されません。</p></div>
          <div className="start-actions">
            <button type="button" className="primary-button" onClick={startFresh}>最初から始める</button>
            <button type="button" className="secondary-button" onClick={startSample}>記入例を読み込む</button>
            {hasSaved ? <button type="button" className="secondary-button" onClick={continueSaved}>続きから始める</button> : null}
            <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}><FileUp size={18} />JSONデータを読み込む</button>
          </div>
          <div className="start-help"><p>完璧に書かなくても大丈夫です。分かる範囲から入力してください。</p><p>記入例は正解ではなく、入力方法を理解するための例です。</p></div>
          {globalMessage ? <p className="inline-message">{globalMessage}</p> : null}
        </main>
      </div>
    );
  }
  return (
    <div className="app-shell">
      <input ref={fileInputRef} type="file" accept="application/json" className="visually-hidden" onChange={handleJsonImport} />
      <aside className="sidebar">
        <div className="sidebar-header">
          <p className="sidebar-eyebrow">有料note改善ナビ</p>
          <h1>改善の順番を見える化する</h1>
          <p>後から何度でも修正できます。今回は3項目に絞って進めます。</p>
        </div>
        <div className="progress-card">
          <div className="progress-labels"><span>進捗</span><strong>{progress}%</strong></div>
          <div className="progress-bar" aria-hidden="true"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <p>{currentStep === "summary" ? "結果まとめ" : `${currentIndex + 1} / 6 ステップ`}</p>
        </div>
        <nav className="step-nav" aria-label="入力ステップ">
          {STEP_LIST.map((step) => {
            const isActive = currentStep === step.id;
            const completed = step.id === "summary" ? false : stepCompletion[step.id];
            return (
              <button key={step.id} type="button" className={`step-link ${isActive ? "active" : ""}`} onClick={() => goToStep(step.id)}>
                <span className={`step-accent ${step.accent}`} />
                <span className="step-copy"><span>{step.label}</span>{completed ? <small>完了</small> : <small>入力中</small>}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="save-chip"><Save size={16} /><span>{getSaveLabel(saveState)}</span></div>
          <button type="button" className="text-button" onClick={exportJson}><Download size={16} />JSONを書き出す</button>
          <button type="button" className="text-button" onClick={() => fileInputRef.current?.click()}><FileUp size={16} />JSONを読み込む</button>
          <button type="button" className="text-button danger" onClick={resetAll}><Trash2 size={16} />最初からやり直す</button>
        </div>
      </aside>
      <main className="content">
        <header className="content-header">
          <div>
            <p className="page-kicker">{STEP_LIST[currentIndex]?.label ?? "結果まとめ"}</p>
            <h2>{getPageTitle(currentStep)}</h2>
            <p className="page-description">{getPageDescription(currentStep)}</p>
          </div>
          <div className="header-actions">
            <button type="button" className="ghost-button" onClick={() => setMode("start")}>開始画面へ戻る</button>
            {currentStep === "summary" ? <button type="button" className="secondary-button" onClick={copyDesignSheet}><ClipboardCopy size={18} />全文をコピー</button> : null}
          </div>
        </header>
        <section className="notice-banner"><AlertCircle size={18} /><p>{NOTE_TEXT}</p></section>
        {globalMessage ? <div className="global-message">{globalMessage}</div> : null}
        {showSampleNotice ? <div className="global-message">{SAMPLE_NOTICE_TEXT}</div> : null}
        {Object.keys(errors).length > 0 ? <div className="error-summary" role="alert"><AlertCircle size={18} /><p>未入力の項目があります。分かる範囲からで大丈夫なので、必要な欄を埋めてください。</p></div> : null}
        <div className="card-stack">
          {currentStep === "basic" ? renderBasicStep(formData, updateFormData, errors) : null}
          {currentStep === "title" ? renderTitleStep(formData, updateFormData, updateReviewAnswer, errors) : null}
          {currentStep === "free" ? renderFreeStep(formData, updateFormData, updateReviewAnswer, errors) : null}
          {currentStep === "paid" ? renderPaidStep(formData, updateFormData, updateReviewAnswer, toggleDeliverable, errors) : null}
          {currentStep === "sns" ? renderSnsStep(formData, updateFormData, updateReviewAnswer, errors) : null}
          {currentStep === "plan" ? renderPlanStep(formData, updateFormData, updateReviewAnswer, errors) : null}
          {currentStep === "summary" ? renderSummaryStep(formData, updateFormData, summaryCounts, categoryCounts, chosenPriorityItems, toggleChosenPriority, finalDesignText, copyDesignSheet, exportJson, errors) : null}
        </div>
        <footer className="footer-nav">
          <button type="button" className="ghost-button" onClick={prevStep} disabled={currentStep === "basic"}><ArrowLeft size={18} />戻る</button>
          <div className="footer-copy"><span>保存方式: localStorage</span><span>外部送信は行いません</span></div>
          {currentStep === "summary" ? <button type="button" className="primary-button" onClick={() => window.print()}>印刷する</button> : <button type="button" className="primary-button" onClick={nextStep}>次へ<ArrowRight size={18} /></button>}
        </footer>
      </main>
    </div>
  );
}

export function validateStep(step: StepId, data: FormData): ErrorMap {
  const nextErrors: ErrorMap = {};
  if (step === "basic") {
    if (!data.basic.publishStatus) nextErrors.publishStatus = "公開状態を選んでください。";
    if (!data.basic.currentTitle.trim()) nextErrors.currentTitle = "現在のタイトルを入力してください。";
    if (!data.basic.price.trim()) nextErrors.price = "販売価格を入力してください。";
    if (!data.basic.targetReader.trim()) nextErrors.targetReader = "届けたい読者を入力してください。";
    if (!data.basic.readerProblem.trim()) nextErrors.readerProblem = "読者が困っていることを入力してください。";
    if (!data.basic.goalAfterReading.trim()) nextErrors.goalAfterReading = "読後の到達点を入力してください。";
    if (!data.basic.ownExperience.trim()) nextErrors.ownExperience = "自分の経験を入力してください。";
  }
  if (step === "title") {
    if (!data.title.finalTitle.trim()) nextErrors.finalTitle = "採用するタイトルを入力してください。";
    if (!data.title.finalTitleReason.trim()) nextErrors.finalTitleReason = "採用理由を入力してください。";
    validateReviewRange(nextErrors, data, 1, 4);
  }
  if (step === "free") {
    for (const block of FREE_BLOCKS) {
      const value = data.free.blocks[block.key];
      if (!value.improved.trim()) nextErrors[`free-${block.key}`] = "改善後の文章・要点を入力してください。";
    }
    validateReviewRange(nextErrors, data, 5, 8);
  }
  if (step === "paid") {
    if (data.paid.deliverables.length === 0) nextErrors.deliverables = "購入者に渡すものを1つ以上選んでください。";
    if (!data.paid.productSummary.trim()) nextErrors.productSummary = "商品を一文で説明する欄を入力してください。";
    validateReviewRange(nextErrors, data, 9, 12);
  }
  if (step === "sns") {
    data.sns.posts.forEach((post, index) => {
      if (!post.text.trim()) nextErrors[`post-text-${index}`] = "投稿文を入力してください。";
      if (!post.noteUrl.trim()) nextErrors[`post-url-${index}`] = "note URLを入力してください。";
    });
    validateReviewRange(nextErrors, data, 13, 16);
  }
  if (step === "plan") {
    if (!data.plan.targetDate.trim()) nextErrors.targetDate = "公開予定日または再公開予定日を入力してください。";
    if (!data.plan.dailyTime) nextErrors.dailyTime = "1日に使える時間を選んでください。";
    if (!data.plan.focusArea.trim()) nextErrors.focusArea = "今、一番直したい分野を選んでください。";
    if (!data.plan.reviewMetrics.trim()) nextErrors.reviewMetrics = "公開後に確認する項目を入力してください。";
    data.plan.days.forEach((day) => {
      if (!day.tasks.trim()) nextErrors[`plan-task-${day.day}`] = "具体的にやることを入力してください。";
      if (!day.doneDefinition.trim()) nextErrors[`plan-done-${day.day}`] = "完了条件を入力してください。";
    });
    validateReviewRange(nextErrors, data, 17, 20);
  }
  if (step === "summary" && data.chosenPriorityIds.length !== 3) {
    nextErrors.chosenPriorityIds = "優先して直す3項目を3件選んでください。";
  }
  return nextErrors;
}

function validateReviewRange(errors: ErrorMap, data: FormData, start: number, end: number) {
  for (let id = start; id <= end; id += 1) {
    const item = data.reviews[id];
    if (!item.status) errors[`review-status-${id}`] = "自己確認を選んでください。";
    if (!item.evidence.trim()) errors[`review-evidence-${id}`] = "根拠・現状を入力してください。";
    if (!item.nextAction.trim()) errors[`review-next-${id}`] = "次に直すことを入力してください。";
    if (!item.priority) errors[`review-priority-${id}`] = "優先度を選んでください。";
  }
}

function getSaveLabel(saveState: SaveState) {
  if (saveState === "saving") return "保存中";
  if (saveState === "saved") return "保存済み";
  if (saveState === "error") return "保存に失敗";
  return "未保存";
}

function getPageTitle(step: StepId) {
  return {
    basic: "現状を整理して、どこから直すか見える形にします",
    title: "タイトルの伝わり方を4項目で点検します",
    free: "無料部分の流れと役割を順番に見直します",
    paid: "購入後に何が残るかを具体的に設計します",
    sns: "XとThreadsの導線を、記事の価値が伝わる形に整えます",
    plan: "次の7日間で進める改善作業を小さく切り分けます",
    summary: "今回の整理結果を1枚の設計書にまとめます",
  }[step];
}

function getPageDescription(step: StepId) {
  return {
    basic: "分かる範囲から入力してください。公開前なら数値項目は空欄でも進められます。",
    title: "迷う場合は「一部書かれている」を選んで構いません。",
    free: "完璧な文章でなくても、要点が見える状態を目指します。",
    paid: "購入者が持ち帰れるものが見えるほど、価値が伝わりやすくなります。",
    sns: "告知だけで終わらず、悩みや体験から入る導線を意識します。",
    plan: "1日に使える時間に収まる作業へ分けるのがポイントです。",
    summary: "点数ではなく、明確な部分と次に直す部分を整理して確認します。",
  }[step];
}
function renderBasicStep(formData: FormData, updateFormData: (updater: (previous: FormData) => FormData) => void, errors: ErrorMap) {
  const optionalMetrics = formData.basic.publishStatus === "before";
  return (
    <>
      <Card title="基本情報" description="有料noteの現在地を整理します。後から何度でも修正できます。">
        <RadioGroupField label="公開状態" value={formData.basic.publishStatus} options={[{ label: "公開前", value: "before" }, { label: "公開済み", value: "published" }]} onChange={(value) => updateFormData((previous) => ({ ...previous, basic: { ...previous.basic, publishStatus: value as FormData["basic"]["publishStatus"] } }))} error={errors.publishStatus} />
        <TextInput label="現在のタイトル" value={formData.basic.currentTitle} onChange={(value) => updateFormData((previous) => ({ ...previous, basic: { ...previous.basic, currentTitle: value } }))} placeholder="例: 50代会社員がAIで稼ぐ前に作るべき、売れる原稿の芯" error={errors.currentTitle} />
        <div className="grid-two">
          <TextInput label="記事URL" value={formData.basic.articleUrl} onChange={(value) => updateFormData((previous) => ({ ...previous, basic: { ...previous.basic, articleUrl: value } }))} placeholder="例: https://note.com/..." />
          <TextInput label="販売価格" value={formData.basic.price} onChange={(value) => updateFormData((previous) => ({ ...previous, basic: { ...previous.basic, price: value } }))} placeholder="例: 500" error={errors.price} />
        </div>
        <div className="grid-three">
          <TextInput label="公開日" type="date" value={formData.basic.publishDate} onChange={(value) => updateFormData((previous) => ({ ...previous, basic: { ...previous.basic, publishDate: value } }))} />
          <TextInput label="公開からの日数" value={formData.basic.daysSincePublish} onChange={(value) => updateFormData((previous) => ({ ...previous, basic: { ...previous.basic, daysSincePublish: value } }))} placeholder="例: 10" />
          <FieldHint>公開前なら空欄でも大丈夫です。</FieldHint>
        </div>
        <div className="grid-three">
          <TextInput label={`閲覧数${optionalMetrics ? "（任意）" : ""}`} value={formData.basic.views} onChange={(value) => updateFormData((previous) => ({ ...previous, basic: { ...previous.basic, views: value } }))} placeholder="例: 236" />
          <TextInput label={`スキ数${optionalMetrics ? "（任意）" : ""}`} value={formData.basic.likes} onChange={(value) => updateFormData((previous) => ({ ...previous, basic: { ...previous.basic, likes: value } }))} placeholder="例: 4" />
          <TextInput label={`販売数${optionalMetrics ? "（任意）" : ""}`} value={formData.basic.sales} onChange={(value) => updateFormData((previous) => ({ ...previous, basic: { ...previous.basic, sales: value } }))} placeholder="例: 0" />
        </div>
      </Card>
      <Card title="読者像" description="誰に向けたnoteなのか、ここで言葉にしておくと後の修正が楽になります。">
        <TextArea label="届けたい読者" value={formData.basic.targetReader} onChange={(value) => updateFormData((previous) => ({ ...previous, basic: { ...previous.basic, targetReader: value } }))} placeholder="例: 有料noteを出したが売れず、何を直せばよいか分からない人" error={errors.targetReader} />
        <TextArea label="読者が一番困っていること" value={formData.basic.readerProblem} onChange={(value) => updateFormData((previous) => ({ ...previous, basic: { ...previous.basic, readerProblem: value } }))} placeholder="例: タイトル、無料部分、有料部分、SNS導線のどこを直せばよいか分からない" error={errors.readerProblem} />
        <TextArea label="読後の到達点" value={formData.basic.goalAfterReading} onChange={(value) => updateFormData((previous) => ({ ...previous, basic: { ...previous.basic, goalAfterReading: value } }))} placeholder="例: 優先して直す3項目と、7日間の改善計画を作れる" error={errors.goalAfterReading} />
        <TextArea label="この記事に使っている自分の経験" value={formData.basic.ownExperience} onChange={(value) => updateFormData((previous) => ({ ...previous, basic: { ...previous.basic, ownExperience: value } }))} placeholder="例: 無料記事を5本公開した後、500円の有料noteを出したが販売数は0件だった。" error={errors.ownExperience} />
      </Card>
    </>
  );
}

function renderTitleStep(formData: FormData, updateFormData: (updater: (previous: FormData) => FormData) => void, updateReviewAnswer: (id: number, key: keyof ReviewAnswer, value: string) => void, errors: ErrorMap) {
  return (
    <>
      <Card title="タイトル再設計欄" description="現在のタイトルを土台にしながら、伝わり方を整えます。">
        <TextInput label="現在のタイトル" value={formData.basic.currentTitle} readOnly />
        <TextArea label="タイトルに残したい要素" value={formData.title.keepElements} onChange={(value) => updateFormData((previous) => ({ ...previous, title: { ...previous.title, keepElements: value } }))} placeholder="例: 50代会社員、AI、売れる原稿" />
        <TextArea label="タイトルに足りない要素" value={formData.title.missingElements} onChange={(value) => updateFormData((previous) => ({ ...previous, title: { ...previous.title, missingElements: value } }))} placeholder="例: 誰の悩みか、読後に何が決まるか" />
        <div className="grid-three">
          {formData.title.titleIdeas.map((title, index) => <TextArea key={index} label={`改善タイトル案${index + 1}`} value={title} onChange={(value) => updateFormData((previous) => { const titleIdeas = [...previous.title.titleIdeas] as [string, string, string]; titleIdeas[index] = value; return { ...previous, title: { ...previous.title, titleIdeas } }; })} placeholder="例: 有料noteが売れない人へ..." />)}
        </div>
        <TextArea label="最終的に採用するタイトル" value={formData.title.finalTitle} onChange={(value) => updateFormData((previous) => ({ ...previous, title: { ...previous.title, finalTitle: value } }))} placeholder="例: 有料noteが売れない人へ タイトルと無料部分を整える原稿改善ワーク" error={errors.finalTitle} />
        <TextArea label="採用理由" value={formData.title.finalTitleReason} onChange={(value) => updateFormData((previous) => ({ ...previous, title: { ...previous.title, finalTitleReason: value } }))} placeholder="例: 悩みと改善対象が先に伝わり、内容が具体的に見えるから" error={errors.finalTitleReason} />
      </Card>
      <ReviewSection title="タイトルの確認項目" itemIds={[1, 2, 3, 4]} formData={formData} updateReviewAnswer={updateReviewAnswer} errors={errors} />
    </>
  );
}

function renderFreeStep(formData: FormData, updateFormData: (updater: (previous: FormData) => FormData) => void, updateReviewAnswer: (id: number, key: keyof ReviewAnswer, value: string) => void, errors: ErrorMap) {
  return (
    <>
      <Card title="無料部分の5ブロック" description="無料部分だけでも流れが見えるように、5つの役割に分けて整理します。">
        {FREE_BLOCKS.map((block) => (
          <div className="stack-card" key={block.key}>
            <h3>{block.label}</h3>
            <div className="grid-two">
              <TextArea label="現在の内容" value={formData.free.blocks[block.key].current} onChange={(value) => updateFormData((previous) => ({ ...previous, free: { ...previous.free, blocks: { ...previous.free.blocks, [block.key]: { ...previous.free.blocks[block.key], current: value } } } }))} placeholder="今の本文や要点を短く書いてください" />
              <TextArea label="改善後の文章・要点" value={formData.free.blocks[block.key].improved} onChange={(value) => updateFormData((previous) => ({ ...previous, free: { ...previous.free, blocks: { ...previous.free.blocks, [block.key]: { ...previous.free.blocks[block.key], improved: value } } } }))} placeholder="改善後に入れたい要点を書いてください" error={errors[`free-${block.key}`]} />
            </div>
          </div>
        ))}
      </Card>
      <ReviewSection title="無料部分の確認項目" itemIds={[5, 6, 7, 8]} formData={formData} updateReviewAnswer={updateReviewAnswer} errors={errors} />
    </>
  );
}
function renderPaidStep(formData: FormData, updateFormData: (updater: (previous: FormData) => FormData) => void, updateReviewAnswer: (id: number, key: keyof ReviewAnswer, value: string) => void, toggleDeliverable: (item: string) => void, errors: ErrorMap) {
  return (
    <>
      <Card title="購入者に渡すもの" description="持ち帰れるものが見えるほど、価値が伝わりやすくなります。">
        <div className="checkbox-grid">{DELIVERABLE_OPTIONS.map((item) => <label key={item} className="checkbox-card"><input type="checkbox" checked={formData.paid.deliverables.includes(item)} onChange={() => toggleDeliverable(item)} /><span>{item}</span></label>)}</div>
        {errors.deliverables ? <p className="field-error">{errors.deliverables}</p> : null}
        {formData.paid.deliverables.includes("その他") ? <TextInput label="その他の内容" value={formData.paid.otherDeliverable} onChange={(value) => updateFormData((previous) => ({ ...previous, paid: { ...previous.paid, otherDeliverable: value } }))} placeholder="例: ワークの進め方ガイド" /> : null}
      </Card>
      <Card title="有料部分の7ブロック" description="有料部分の中身と、購入者が完成させるものを対応させて整理します。">
        {PAID_BLOCKS.map((block) => <div className="stack-card" key={block.key}><h3>{block.label}</h3><div className="grid-two"><TextArea label="入れる内容" value={formData.paid.blocks[block.key].content} onChange={(value) => updateFormData((previous) => ({ ...previous, paid: { ...previous.paid, blocks: { ...previous.paid.blocks, [block.key]: { ...previous.paid.blocks[block.key], content: value } } } }))} placeholder="例: タイトル案を3本作る手順" /><TextArea label="購入者が完成させるもの" value={formData.paid.blocks[block.key].outcome} onChange={(value) => updateFormData((previous) => ({ ...previous, paid: { ...previous.paid, blocks: { ...previous.paid.blocks, [block.key]: { ...previous.paid.blocks[block.key], outcome: value } } } }))} placeholder="例: 採用タイトルが決まる" /></div></div>)}
      </Card>
      <Card title="商品を一文で説明する欄" description="どんな人が、何を使って、どこまで進めるのかを一文で整理します。">
        <TextArea label="商品説明" value={formData.paid.productSummary} onChange={(value) => updateFormData((previous) => ({ ...previous, paid: { ...previous.paid, productSummary: value } }))} placeholder="例: 有料noteを出したものの売れず..." error={errors.productSummary} />
      </Card>
      <ReviewSection title="有料部分の確認項目" itemIds={[9, 10, 11, 12]} formData={formData} updateReviewAnswer={updateReviewAnswer} errors={errors} />
    </>
  );
}

function renderSnsStep(formData: FormData, updateFormData: (updater: (previous: FormData) => FormData) => void, updateReviewAnswer: (id: number, key: keyof ReviewAnswer, value: string) => void, errors: ErrorMap) {
  return (
    <>
      <Card title="X・Threads投稿" description="告知だけではなく、悩みや体験から自然に記事へつながる導線を作ります。">
        {formData.sns.posts.map((post, index) => (
          <div className="stack-card" key={`${post.platform}-${index}`}>
            <h3>投稿{index + 1}</h3>
            <div className="meta-badges"><span className="meta-badge">{post.platform}</span><span className="meta-badge">{post.role}</span></div>
            <TextArea label="投稿文" value={post.text} onChange={(value) => updateFormData((previous) => ({ ...previous, sns: { ...previous.sns, posts: previous.sns.posts.map((item, itemIndex) => itemIndex === index ? { ...item, text: value } : item) } }))} placeholder="例: 有料noteが売れないとき、原因を一気に増やしすぎると..." error={errors[`post-text-${index}`]} />
            <div className="grid-two"><TextInput label="note URL" value={post.noteUrl} onChange={(value) => updateFormData((previous) => ({ ...previous, sns: { ...previous.sns, posts: previous.sns.posts.map((item, itemIndex) => itemIndex === index ? { ...item, noteUrl: value } : item) } }))} placeholder="例: https://note.com/..." error={errors[`post-url-${index}`]} /><TextInput label="画像名" value={post.imageName} onChange={(value) => updateFormData((previous) => ({ ...previous, sns: { ...previous.sns, posts: previous.sns.posts.map((item, itemIndex) => itemIndex === index ? { ...item, imageName: value } : item) } }))} placeholder="例: note-kaizen-01.png" /></div>
            <div className="grid-three"><TextInput label="投稿日" type="date" value={post.postDate} onChange={(value) => updateFormData((previous) => ({ ...previous, sns: { ...previous.sns, posts: previous.sns.posts.map((item, itemIndex) => itemIndex === index ? { ...item, postDate: value } : item) } }))} /><TextInput label="投稿時刻" type="time" value={post.postTime} onChange={(value) => updateFormData((previous) => ({ ...previous, sns: { ...previous.sns, posts: previous.sns.posts.map((item, itemIndex) => itemIndex === index ? { ...item, postTime: value } : item) } }))} /><SelectField label="状態" value={post.status} onChange={(value) => updateFormData((previous) => ({ ...previous, sns: { ...previous.sns, posts: previous.sns.posts.map((item, itemIndex) => itemIndex === index ? { ...item, status: value as FormData["sns"]["posts"][number]["status"] } : item) } }))} options={[{ label: "未着手", value: "todo" }, { label: "作成中", value: "drafting" }, { label: "作成済み", value: "ready" }, { label: "予約済み", value: "scheduled" }, { label: "投稿済み", value: "posted" }]} /></div>
          </div>
        ))}
      </Card>
      <ReviewSection title="SNS導線の確認項目" itemIds={[13, 14, 15, 16]} formData={formData} updateReviewAnswer={updateReviewAnswer} errors={errors} />
    </>
  );
}

function renderPlanStep(formData: FormData, updateFormData: (updater: (previous: FormData) => FormData) => void, updateReviewAnswer: (id: number, key: keyof ReviewAnswer, value: string) => void, errors: ErrorMap) {
  return (
    <>
      <Card title="改善計画の前提" description="1日に使える時間と、先に直す分野を決めてから7日間へ落とし込みます。">
        <div className="grid-three"><TextInput label="公開予定日または再公開予定日" type="date" value={formData.plan.targetDate} onChange={(value) => updateFormData((previous) => ({ ...previous, plan: { ...previous.plan, targetDate: value } }))} error={errors.targetDate} /><SelectField label="1日に使える時間" value={formData.plan.dailyTime} onChange={(value) => updateFormData((previous) => ({ ...previous, plan: { ...previous.plan, dailyTime: value as FormData["plan"]["dailyTime"] } }))} options={[{ label: "選択してください", value: "" }, { label: "15分", value: "15" }, { label: "30分", value: "30" }, { label: "60分", value: "60" }, { label: "90分以上", value: "90" }]} error={errors.dailyTime} /><SelectField label="今、一番直したい分野" value={formData.plan.focusArea} onChange={(value) => updateFormData((previous) => ({ ...previous, plan: { ...previous.plan, focusArea: value } }))} options={[{ label: "選択してください", value: "" }, { label: "タイトル", value: "タイトル" }, { label: "読者設定", value: "読者設定" }, { label: "無料部分", value: "無料部分" }, { label: "有料部分", value: "有料部分" }, { label: "特典", value: "特典" }, { label: "X・Threads導線", value: "X・Threads導線" }, { label: "全体構成", value: "全体構成" }]} error={errors.focusArea} /></div>
        <TextArea label="公開後に確認する項目" value={formData.plan.reviewMetrics} onChange={(value) => updateFormData((previous) => ({ ...previous, plan: { ...previous.plan, reviewMetrics: value } }))} placeholder="例: 閲覧数、スキ数、販売数、Xの保存数、Threadsの反応を確認する" error={errors.reviewMetrics} />
      </Card>
      <Card title="7日間の計画" description="初期テーマを土台にしつつ、今の状況に合わせて調整してください。">
        {formData.plan.days.map((day) => <div className="stack-card" key={day.day}><h3>{day.day}日目</h3><div className="grid-three"><TextInput label="日付" type="date" value={day.date} onChange={(value) => updateFormData((previous) => ({ ...previous, plan: { ...previous.plan, days: previous.plan.days.map((item) => item.day === day.day ? { ...item, date: value } : item) } }))} /><TextInput label="作業テーマ" value={day.theme} onChange={(value) => updateFormData((previous) => ({ ...previous, plan: { ...previous.plan, days: previous.plan.days.map((item) => item.day === day.day ? { ...item, theme: value } : item) } }))} /><SelectField label="状態" value={day.status} onChange={(value) => updateFormData((previous) => ({ ...previous, plan: { ...previous.plan, days: previous.plan.days.map((item) => item.day === day.day ? { ...item, status: value as PlanDay["status"] } : item) } }))} options={[{ label: "未着手", value: "todo" }, { label: "進行中", value: "doing" }, { label: "完了", value: "done" }]} /></div><div className="grid-two"><TextArea label="具体的にやること" value={day.tasks} onChange={(value) => updateFormData((previous) => ({ ...previous, plan: { ...previous.plan, days: previous.plan.days.map((item) => item.day === day.day ? { ...item, tasks: value } : item) } }))} placeholder="例: タイトル案を3本作る" error={errors[`plan-task-${day.day}`]} /><TextArea label="完了条件" value={day.doneDefinition} onChange={(value) => updateFormData((previous) => ({ ...previous, plan: { ...previous.plan, days: previous.plan.days.map((item) => item.day === day.day ? { ...item, doneDefinition: value } : item) } }))} placeholder="例: 比較できる3案が並んでいる" error={errors[`plan-done-${day.day}`]} /></div></div>)}
      </Card>
      <ReviewSection title="改善計画の確認項目" itemIds={[17, 18, 19, 20]} formData={formData} updateReviewAnswer={updateReviewAnswer} errors={errors} />
    </>
  );
}
function renderSummaryStep(formData: FormData, updateFormData: (updater: (previous: FormData) => FormData) => void, summaryCounts: ReturnType<typeof summarizeStatuses>, categoryCounts: ReturnType<typeof summarizeByCategory>, chosenPriorityItems: ReturnType<typeof getChosenPriorityItems>, toggleChosenPriority: (id: number) => void, finalDesignText: string, copyDesignSheet: () => void, exportJson: () => void, errors: ErrorMap) {
  const highItems = REVIEW_ITEMS.filter((item) => formData.reviews[item.id].priority === "high");
  const nextItems = REVIEW_ITEMS.filter((item) => formData.reviews[item.id].priority === "next");
  const selectionPool = highItems.length >= 3 ? highItems : [...highItems, ...nextItems];
  return (
    <>
      <Card title="全体の確認状況" description="点数ではなく、明確な部分と曖昧な部分の件数を確認します。"><div className="summary-grid"><SummaryMetric label="明確に書かれている" value={`${summaryCounts.clear}件`} tone="good" /><SummaryMetric label="一部書かれている" value={`${summaryCounts.partial}件`} tone="mid" /><SummaryMetric label="まだ書かれていない" value={`${summaryCounts.missing}件`} tone="warn" /><SummaryMetric label="回答済み" value={`${summaryCounts.answered} / 20件`} tone="neutral" /></div></Card>
      <Card title="分野別の状態" description="どの分野に手を入れる余地が多いかを確認します。">{Object.entries(categoryCounts).map(([key, counts]) => { const total = counts.clear + counts.partial + counts.missing; return <div className="bar-row" key={key}><div className="bar-row-header"><strong>{getCategoryLabel(key as keyof typeof categoryCounts)}</strong><span>{total}件</span></div><div className="bar-track" aria-hidden="true"><div className="bar-segment clear" style={{ width: `${total === 0 ? 0 : (counts.clear / total) * 100}%` }} /><div className="bar-segment partial" style={{ width: `${total === 0 ? 0 : (counts.partial / total) * 100}%` }} /><div className="bar-segment missing" style={{ width: `${total === 0 ? 0 : (counts.missing / total) * 100}%` }} /></div><p className="bar-caption">明確 {counts.clear} / 一部 {counts.partial} / 未整理 {counts.missing}</p></div>; })}</Card>
      <Card title="優先して直す3項目" description="最優先が多い場合は3件に絞り、少ない場合は「次に直す」から追加できます。"><div className="priority-picker">{selectionPool.map((item) => { const answer = formData.reviews[item.id]; const selected = formData.chosenPriorityIds.includes(item.id); return <label key={item.id} className={`priority-card ${selected ? "selected" : ""}`}><input type="checkbox" checked={selected} onChange={() => toggleChosenPriority(item.id)} /><div><strong>{item.title}</strong><p>{getCategoryLabel(item.category)} / {getPriorityLabel(answer.priority)}</p><p>根拠・現状: {answer.evidence || "未記入"}</p><p>次に直すこと: {answer.nextAction || "未記入"}</p></div></label>; })}</div>{errors.chosenPriorityIds ? <p className="field-error">{errors.chosenPriorityIds}</p> : null}<div className="selected-priority-list">{chosenPriorityItems.map((item, index) => <div key={item.meta.id} className="stack-card compact"><h3>{index + 1}. {item.meta.title}</h3><p>分野: {getCategoryLabel(item.meta.category)}</p><p>根拠・現状: {item.answer.evidence || "未記入"}</p><p>次に直すこと: {item.answer.nextAction || "未記入"}</p></div>)}</div></Card>
      <Card title="今回あえて直さないこと" description="作業を広げすぎないために、今回は触らない範囲も決めておきます。"><TextArea label="今回はあえて直さないこと" value={formData.doNotChangeThisTime} onChange={(value) => updateFormData((previous) => ({ ...previous, doNotChangeThisTime: value }))} placeholder="例: 今回はタイトルの方向性と画像は大きく変えず、無料部分の具体性を優先する" /></Card>
      <Card title="最終設計書" description="このままコピーや印刷に使える形でまとめています。"><div className="action-row"><button type="button" className="secondary-button" onClick={copyDesignSheet}><ClipboardCopy size={18} />全文をコピー</button><button type="button" className="secondary-button" onClick={() => window.print()}>印刷する</button><button type="button" className="secondary-button" onClick={exportJson}><Download size={18} />JSONを書き出す</button></div><pre className="design-sheet">{finalDesignText}</pre></Card>
    </>
  );
}

function ReviewSection({ title, itemIds, formData, updateReviewAnswer, errors }: { title: string; itemIds: number[]; formData: FormData; updateReviewAnswer: (id: number, key: keyof ReviewAnswer, value: string) => void; errors: ErrorMap; }) {
  return <Card title={title} description="自己確認は3段階から選べます。迷う場合は「一部書かれている」を選んで構いません。">{itemIds.map((id) => { const meta = REVIEW_ITEMS.find((item) => item.id === id); if (!meta) return null; const answer = formData.reviews[id]; return <div key={id} className="stack-card"><div className="review-heading"><span className="review-number">{id}</span><h3>{meta.title}</h3></div><RadioGroupField label="自己確認" value={answer.status} options={[{ label: "明確に書かれている", value: "clear" }, { label: "一部書かれている", value: "partial" }, { label: "まだ書かれていない", value: "missing" }]} onChange={(value) => updateReviewAnswer(id, "status", value)} error={errors[`review-status-${id}`]} /><div className="grid-two"><TextArea label="根拠・現状" value={answer.evidence} onChange={(value) => updateReviewAnswer(id, "evidence", value)} placeholder="今の状態を短く書いてください" error={errors[`review-evidence-${id}`]} /><TextArea label="次に直すこと" value={answer.nextAction} onChange={(value) => updateReviewAnswer(id, "nextAction", value)} placeholder="次の一手を短く書いてください" error={errors[`review-next-${id}`]} /></div><SelectField label="優先度" value={answer.priority} onChange={(value) => updateReviewAnswer(id, "priority", value)} options={[{ label: "選択してください", value: "" }, { label: "最優先", value: "high" }, { label: "次に直す", value: "next" }, { label: "今回は保留", value: "later" }]} error={errors[`review-priority-${id}`]} /></div>; })}</Card>;
}

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode; }) {
  return <section className="content-card"><div className="card-header"><h2>{title}</h2>{description ? <p>{description}</p> : null}</div><div className="card-body">{children}</div></section>;
}

function TextInput({ label, value, onChange, placeholder, type = "text", error, readOnly = false }: { label: string; value: string; onChange?: (value: string) => void; placeholder?: string; type?: string; error?: string; readOnly?: boolean; }) {
  const id = useId();
  return <label className="field" htmlFor={id}><span>{label}</span><input id={id} type={type} value={value} readOnly={readOnly} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} aria-invalid={Boolean(error)} />{error ? <span className="field-error">{error}</span> : null}</label>;
}

function TextArea({ label, value, onChange, placeholder, error }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; error?: string; }) {
  const id = useId();
  return <label className="field" htmlFor={id}><span>{label}</span><textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-invalid={Boolean(error)} />{error ? <span className="field-error">{error}</span> : null}</label>;
}

function SelectField({ label, value, onChange, options, error }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ label: string; value: string }>; error?: string; }) {
  const id = useId();
  return <label className="field" htmlFor={id}><span>{label}</span><select id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)}>{options.map((option) => <option key={option.value || option.label} value={option.value}>{option.label}</option>)}</select>{error ? <span className="field-error">{error}</span> : null}</label>;
}

function RadioGroupField({ label, value, options, onChange, error }: { label: string; value: string; options: Array<{ label: string; value: string }>; onChange: (value: string) => void; error?: string; }) {
  const id = useId();
  return <fieldset className="field"><legend id={id}>{label}</legend><div className="radio-grid" aria-labelledby={id}>{options.map((option) => <label key={option.value} className={`radio-card ${value === option.value ? "selected" : ""}`}><input type="radio" name={id} value={option.value} checked={value === option.value} onChange={(event) => onChange(event.target.value)} /><span>{option.label}</span></label>)}</div>{error ? <span className="field-error">{error}</span> : null}</fieldset>;
}

function SummaryMetric({ label, value, tone }: { label: string; value: string; tone: "good" | "mid" | "warn" | "neutral"; }) {
  return <div className={`metric-card ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="field-hint">{children}</p>;
}

export default App;











