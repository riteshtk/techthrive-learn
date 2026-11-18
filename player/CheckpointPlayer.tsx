"use client";

// A lesson's checkpoint (PRD P6; spec 04 §11): three questions, one at a
// time. The first answer to each is stored and scored; the right answer is
// revealed once anything is picked, and later picks show their feedback
// without changing the score. Then "Next question" (approved in place of
// the design's "Try again"), and a result at the end: 80% passes.

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { Icon } from "@/components/ui/Icon";
import type { Checkpoint, Question } from "@/content/types";
import {
  PASS_MARK,
  rightOption,
  scoreCheckpoint,
  verdictOf,
} from "@/lib/checkpoint";
import {
  answerQuestion,
  EMPTY_LEARNING,
  learningStore,
  lessonKey,
  type OptionId,
} from "@/lib/learning";

const CHIP = {
  right: { label: "Right", tone: "green" },
  partial: { label: "Partly right", tone: "amber" },
  wrong: { label: "Not this one", tone: "red" },
} as const;

const getServerLearning = () => EMPTY_LEARNING;

export function CheckpointPlayer({
  checkpoint,
  lesson,
}: {
  checkpoint: Checkpoint;
  lesson: { title: string; path: string; steps: string[] };
}) {
  const key = lessonKey(checkpoint.topic, checkpoint.lesson);
  const learning = useSyncExternalStore(
    learningStore.subscribe,
    learningStore.get,
    getServerLearning,
  );
  const answers = learning.checkpoints[key]?.answers ?? {};
  const total = checkpoint.questions.length;

  // Start at the first unanswered question (or the result once all are).
  const [index, setIndex] = useState<number | null>(null);
  const firstOpen = checkpoint.questions.findIndex((q) => !answers[q.id]);
  const current = index ?? (firstOpen === -1 ? total : firstOpen);
  const question = checkpoint.questions[current];

  if (!question)
    return (
      <Result
        checkpoint={checkpoint}
        answers={answers}
        lesson={lesson}
        onReview={() => setIndex(0)}
      />
    );

  return (
    <QuestionView
      key={question.id}
      question={question}
      n={current + 1}
      total={total}
      first={answers[question.id]}
      lesson={lesson}
      onAnswer={(option) => {
        // Stay on this question to read why, until "Next question".
        setIndex(current);
        learningStore.update((s) =>
          answerQuestion(
            s,
            key,
            question.id,
            option,
            total,
            new Date().toISOString(),
          ),
        );
      }}
      onNext={() => setIndex(current + 1)}
    />
  );
}

function QuestionView({
  question,
  n,
  total,
  first,
  lesson,
  onAnswer,
  onNext,
}: {
  question: Question;
  n: number;
  total: number;
  first: OptionId | undefined;
  lesson: { title: string; path: string; steps: string[] };
  onAnswer: (option: OptionId) => void;
  onNext: () => void;
}) {
  // What's on show: the first answer, until the learner looks at another.
  const [shown, setShown] = useState<OptionId | undefined>(first);
  const picked = shown ?? first;
  const right = rightOption(question);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);
  const answeredNow = useRef(false);

  useEffect(() => {
    if (answeredNow.current) resultRef.current?.focus();
  }, [first]);

  const pick = (option: OptionId) => {
    setShown(option);
    if (!first) {
      answeredNow.current = true;
      onAnswer(option);
    }
  };

  // A radio group: arrows move focus only, so a stray key never answers.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = optionRefs.current.findIndex(
      (el) => el === document.activeElement,
    );
    if (i < 0) return;
    const d =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (!d) return;
    e.preventDefault();
    optionRefs.current[(i + d + 4) % 4]?.focus();
  };

  const verdict = picked ? verdictOf(question, picked) : null;
  const firstVerdict = first ? verdictOf(question, first) : null;
  const pickedOption = question.options.find((o) => o.id === picked);
  const replay = `${lesson.path}?step=${question.replayStep}`;
  const stepName = lesson.steps[question.replayStep - 1] ?? "";

  return (
    <div className="tt-cp">
      <section className="tt-cp-main" aria-labelledby="cp-question">
        <div className="tt-cp-top">
          <Link href={lesson.path} className="tt-btn tt-btn-sm">
            <svg
              className="tt-ic tt-ic-s"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            {lesson.title}
          </Link>
          <p className="tt-lbl">
            Checkpoint · question {n} of {total}
          </p>
          <div className="tt-cp-spacer" />
          <ul className="tt-cp-tags" aria-label="Topics">
            {question.tags.map((t) => (
              <li key={t} className="tt-chip">
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="tt-card-l tt-cp-card">
          <div className="tt-cp-ask">
            <div className="tt-cp-prompt">
              <h1 id="cp-question" className="tt-h2">
                {question.prompt}
              </h1>
              {question.subline && (
                <p className="tt-body-s">{question.subline}</p>
              )}
            </div>
            {question.evidence && (
              <figure className="tt-well tt-cp-evidence">
                <figcaption className="tt-lbl-s">
                  {question.evidence.caption}
                </figcaption>
                <div className="tt-cp-doc">
                  {question.evidence.lines.map((line, i) =>
                    i === question.evidence?.highlight ? (
                      <p key={i}>
                        <mark className="tt-cp-hid">
                          <span className="sr-only">Hidden instruction: </span>
                          {line}
                        </mark>
                      </p>
                    ) : (
                      <p key={i}>{line}</p>
                    ),
                  )}
                </div>
              </figure>
            )}
          </div>

          <div
            className="tt-cp-options"
            role="radiogroup"
            aria-labelledby="cp-question"
            onKeyDown={onKeyDown}
          >
            {question.options.map((o, i) => {
              const v = picked
                ? o.id === picked
                  ? verdictOf(question, o.id)
                  : o.id === right
                    ? "right"
                    : null
                : null;
              return (
                <button
                  key={o.id}
                  ref={(el) => {
                    optionRefs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={o.id === picked}
                  tabIndex={o.id === (picked ?? "A") ? 0 : -1}
                  className={`tt-q${v ? ` tt-q-${v}` : ""}`}
                  onClick={() => pick(o.id)}
                >
                  <span className="tt-q-letter">{o.id}</span>
                  <span className="tt-q-text">{o.text}</span>
                  {v && (
                    <span className={`tt-pill tt-${CHIP[v].tone}`}>
                      {CHIP[v].label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {first && firstVerdict && (
          <div
            ref={resultRef}
            tabIndex={-1}
            className={`tt-tint tt-tint-${firstVerdict === "right" ? "green" : "amber"} tt-cp-result`}
            role="status"
          >
            <p
              className={`tt-h4 tt-${firstVerdict === "right" ? "green" : "amber"}`}
            >
              {firstVerdict === "right"
                ? question.resultHeading.right
                : question.resultHeading.other}
            </p>
            {question.explanation.map((p, i) => (
              <p key={i} className="tt-cp-explain">
                {p}
              </p>
            ))}
            <p className="tt-cap">
              Your first answer counts: {first}
              {first !== right && `. The right answer is ${right}`}.
            </p>
            <div className="tt-cp-actions">
              <Link href={replay} className="tt-btn tt-btn-sm">
                <svg
                  className="tt-ic tt-ic-s"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M7 5l12 7-12 7z" />
                </svg>
                Replay step {question.replayStep} · {stepName}
              </Link>
              {question.see && (
                <Link href={question.see.path} className="tt-btn tt-btn-sm">
                  {question.see.label}
                </Link>
              )}
              <button
                type="button"
                className="tt-btn tt-btn-sm tt-btn-primary"
                onClick={onNext}
              >
                {n < total ? "Next question" : "See your result"}
                <Icon name="arrow-right" />
              </button>
            </div>
          </div>
        )}
      </section>

      <aside className="tt-card-l tt-cp-aside" aria-label="Why">
        <p className="tt-h4">Why</p>
        <hr className="tt-hr" />
        {pickedOption && verdict ? (
          <div className="tt-panel-2 tt-cp-why">
            <p>
              You picked <b>{pickedOption.id}</b>. {pickedOption.why}
            </p>
          </div>
        ) : (
          <div className="tt-panel-2 tt-cp-why">
            <p>Pick an answer first. The explanation starts from it.</p>
          </div>
        )}
        <div className="tt-cp-spacer" />
        {question.reviewCard && (
          <div className="tt-well tt-cp-card-note">
            <Icon name="repeat" />
            <p className="tt-cap">
              Adds a review card: “{question.reviewCard}”
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function Result({
  checkpoint,
  answers,
  lesson,
  onReview,
}: {
  checkpoint: Checkpoint;
  answers: Readonly<Record<string, OptionId>>;
  lesson: { title: string; path: string; steps: string[] };
  onReview: () => void;
}) {
  const score = scoreCheckpoint(checkpoint.questions, answers);
  const pct = Math.round((score.score ?? 0) * 100);
  const passed = score.passed === true;
  return (
    <section className="tt-cp-done" aria-labelledby="cp-result">
      <div className={`tt-card-l tt-cp-summary`}>
        <p className="tt-lbl">Checkpoint · {lesson.title}</p>
        <h1 id="cp-result" className="tt-h2">
          {passed ? "Passed." : "Not passed yet."}
        </h1>
        <p className="tt-body tt-muted">
          {score.points} of {score.total} ({pct}%) from your first answers. You
          need {Math.round(PASS_MARK * 100)}% to pass; a partly right answer
          counts half.
        </p>
        <ol className="tt-cp-list">
          {checkpoint.questions.map((q, i) => {
            const a = answers[q.id];
            const v = a ? verdictOf(q, a) : null;
            return (
              <li key={q.id}>
                <span className="tt-cp-list-n">{i + 1}</span>
                <span className="tt-cp-list-q">{q.prompt}</span>
                {v && (
                  <span className={`tt-pill tt-${CHIP[v].tone}`}>
                    {a}: {CHIP[v].label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <div className="tt-cp-actions">
          <button type="button" className="tt-btn tt-btn-sm" onClick={onReview}>
            Look at the questions again
          </button>
          <Link href={lesson.path} className="tt-btn tt-btn-sm">
            Back to the lesson
          </Link>
          <Link
            href={lesson.path.replace(/lessons\/[^/]+\/$/, "lessons/")}
            className="tt-btn tt-btn-sm tt-btn-primary"
          >
            Back to the course
            <Icon name="arrow-right" />
          </Link>
        </div>
      </div>
    </section>
  );
}
