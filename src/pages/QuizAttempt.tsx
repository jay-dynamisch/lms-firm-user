import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Clock, CheckCircle, Circle, CheckSquare, Square,
  AlertCircle, Loader2, Flag, PartyPopper, XCircle, HelpCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import {
  startQuizAttempt,
  fetchQuizAttempt,
  submitQuizAnswer,
  submitQuizAttempt,
  ApiError,
  ApiQuizAttemptDetail,
  ApiQuestion,
  ApiQuizAttempt,
  ApiQuizAttemptAnswer,
} from '../lib/api';

type AnswerValue = { selected_options?: string[]; text_answer?: string };

const GRADABLE_TYPES = ['single_choice', 'multi_choice', 'true_false'];

function formatTime(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function QuizAttempt() {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId?: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isReviewMode = Boolean(attemptId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<ApiQuizAttemptDetail | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApiQuizAttempt | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ===== Start the attempt on mount =====
  const mapAnswers = (answersArray: ApiQuizAttemptAnswer[] = []) =>
    answersArray.reduce((acc, answer) => {
      acc[answer.question_id] = {
        selected_options: answer.selected_options ?? [],
        text_answer: answer.text_answer ?? '',
      };
      return acc;
    }, {} as Record<string, AnswerValue>);

  useEffect(() => {
    if (!token || !quizId) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = attemptId
          ? await fetchQuizAttempt(attemptId, token)
          : await startQuizAttempt(quizId, token);
        if (cancelled) return;
        setAttempt(data);
        setAnswers(mapAnswers(data.answers));
        if (!attemptId && data.quiz?.time_limit_secs) {
          setTimeLeft(data.quiz.time_limit_secs);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not start this quiz. It may be unavailable or you may have used all your attempts.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token, quizId, attemptId]);

  const questions = attempt?.quiz?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = useMemo(
    () => questions.filter((q) => {
      const a = answers[q.id];
      return a && (a.selected_options?.length || a.text_answer?.trim());
    }).length,
    [answers, questions],
  );

  // ===== Countdown timer =====
  const handleSubmitRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      handleSubmitRef.current();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, result]);

  // ===== Save an answer (debounced per question) =====
  const persistAnswer = useCallback((questionId: string, value: AnswerValue) => {
    if (!attempt || !token || attemptId || result) return;
    setSavingQuestionId(questionId);
    submitQuizAnswer(attempt.id, { question_id: questionId, ...value }, token)
      .catch(() => {
        setError('Could not save that answer — check your connection and try again.');
      })
      .finally(() => setSavingQuestionId((id) => (id === questionId ? null : id)));
  }, [attempt, token, attemptId, result]);

  const updateAnswer = (questionId: string, value: AnswerValue) => {
    if (attemptId || result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    clearTimeout(saveTimers.current[questionId]);
    saveTimers.current[questionId] = setTimeout(() => persistAnswer(questionId, value), 500);
  };

  const handleSelectSingle = (question: ApiQuestion, optionId: string) => {
    updateAnswer(question.id, { selected_options: [optionId] });
  };

  const handleToggleMulti = (question: ApiQuestion, optionId: string) => {
    const current = answers[question.id]?.selected_options ?? [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    updateAnswer(question.id, { selected_options: next });
  };

  const handleTextChange = (question: ApiQuestion, text: string) => {
    updateAnswer(question.id, { text_answer: text });
  };

  // ===== Submit the whole attempt =====
  const doSubmit = useCallback(async () => {
    if (!attempt || !token || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitQuizAttempt(attempt.id, token);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit the quiz. Please try again.');
    } finally {
      setSubmitting(false);
      setConfirmSubmit(false);
    }
  }, [attempt, token, submitting]);
  handleSubmitRef.current = doSubmit;

  // ===== Render states =====
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
        <p>Preparing your quiz…</p>
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="max-w-lg mx-auto py-24 text-center px-6">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" aria-hidden="true" />
        <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <QuizResult
        attempt={attempt!}
        result={result}
        onDone={() => navigate('/quizzes')}
      />
    );
  }

  if (!attempt || !currentQuestion) {
    return (
      <div className="max-w-lg mx-auto py-24 text-center text-gray-500 dark:text-gray-400 px-6">
        This quiz doesn't have any questions yet.
      </div>
    );
  }

  const timeCritical = timeLeft !== null && timeLeft <= 60;

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8">
      {/* Header: progress + timer */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{attempt.quiz.title}</h1>
          <div className="space-y-1 mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            <p>
              Question {currentIndex + 1} of {questions.length} &middot; {answeredCount} answered
            </p>
            {attempt.submitted_at && (
              <p>
                Attempt {attempt.attempt_number} · Submitted {new Date(attempt.submitted_at).toLocaleString()}
                {attempt.score !== undefined && attempt.max_score !== undefined && (
                  <> · Score {attempt.score}/{attempt.max_score}</>
                )}
              </p>
            )}
          </div>
        </div>
        {timeLeft !== null && (
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold',
            timeCritical
              ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
          )}>
            <Clock className="w-4 h-4" aria-hidden="true" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Question card */}
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6"
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <p className="text-base font-medium text-gray-900 dark:text-white">
            {currentQuestion.question_text}
          </p>
          <span className="shrink-0 text-xs font-semibold text-gray-400 dark:text-gray-500">
            {currentQuestion.points} pt{currentQuestion.points === 1 ? '' : 's'}
          </span>
        </div>

        <QuestionInput
          question={currentQuestion}
          answer={answers[currentQuestion.id]}
          disabled={Boolean(attemptId || result)}
          onSelectSingle={(optId) => handleSelectSingle(currentQuestion, optId)}
          onToggleMulti={(optId) => handleToggleMulti(currentQuestion, optId)}
          onTextChange={(text) => handleTextChange(currentQuestion, text)}
        />

        {savingQuestionId === currentQuestion.id && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> Saving…
          </p>
        )}
      </motion.div>

      {/* Question dots */}
      <div className="flex flex-wrap gap-2 mb-8">
        {questions.map((q, i) => {
          const isAnswered = !!(answers[q.id]?.selected_options?.length || answers[q.id]?.text_answer?.trim());
          const isCurrent = i === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors',
                isCurrent
                  ? 'bg-indigo-600 text-white'
                  : isAnswered
                  ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500'
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      {!isReviewMode && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-600 dark:text-gray-300 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              onClick={() => setConfirmSubmit(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
            >
              <Flag className="w-4 h-4" aria-hidden="true" /> Finish quiz
            </button>
          )}
        </div>
      )}

      {/* Submit confirmation */}
      {confirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Submit your answers?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              You've answered {answeredCount} of {questions.length} questions.
            </p>
            {answeredCount < questions.length && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                Unanswered questions will be scored as incorrect.
              </p>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setConfirmSubmit(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300"
              >
                Keep going
              </button>
              <button
                onClick={doSubmit}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// QUESTION INPUT
// ============================================================================

function QuestionInput({
  question, answer, disabled, onSelectSingle, onToggleMulti, onTextChange,
}: {
  question: ApiQuestion;
  answer?: AnswerValue;
  disabled?: boolean;
  onSelectSingle: (optionId: string) => void;
  onToggleMulti: (optionId: string) => void;
  onTextChange: (text: string) => void;
}) {
  const selected = answer?.selected_options ?? [];
  const reviewMode = Boolean(disabled);

  if (question.question_type === 'single_choice' || question.question_type === 'true_false') {
    return (
      <div className="flex flex-col gap-2">
        {(question.options ?? []).map((opt) => {
          const isSelected = selected.includes(opt.id);
          const isCorrect = opt.is_correct === true;
          const isWrongSelected = reviewMode && isSelected && !isCorrect;
          const isCorrectSelected = reviewMode && isSelected && isCorrect;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !disabled && onSelectSingle(opt.id)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-colors',
                reviewMode
                  ? isCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : isWrongSelected
                      ? 'border-red-300 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                      : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                  : isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
              )}
            >
              {isCorrectSelected ? (
                <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : isWrongSelected ? (
                <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : isSelected ? (
                <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <Circle className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              {opt.text}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.question_type === 'multi_choice') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Select all that apply</p>
        {(question.options ?? []).map((opt) => {
          const isSelected = selected.includes(opt.id);
          const isCorrect = opt.is_correct === true;
          const isWrongSelected = reviewMode && isSelected && !isCorrect;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !disabled && onToggleMulti(opt.id)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-colors',
                reviewMode
                  ? isCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : isWrongSelected
                      ? 'border-red-300 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                      : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                  : isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
              )}
            >
              {isSelected ? <CheckSquare className="w-4 h-4 shrink-0" aria-hidden="true" /> : <Square className="w-4 h-4 shrink-0" aria-hidden="true" />}
              {opt.text}
            </button>
          );
        })}
      </div>
    );
  }

  const isEssay = question.question_type === 'essay';
  return (
    <div>
      <textarea
        value={answer?.text_answer ?? ''}
        onChange={(e) => !disabled && onTextChange(e.target.value)}
        placeholder="Type your answer…"
        rows={isEssay ? 6 : 2}
        readOnly={disabled}
        className={cn(
          'w-full px-4 py-3 rounded-xl border text-sm outline-none resize-vertical',
          disabled
            ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400'
            : 'border-gray-200 dark:border-slate-700 bg-transparent text-gray-800 dark:text-gray-100 focus:border-indigo-500',
        )}
      />
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
        <HelpCircle className="w-3 h-3" aria-hidden="true" /> This question is reviewed manually — your score may take a moment to update.
      </p>
    </div>
  );
}

// ============================================================================
// RESULTS SCREEN
// ============================================================================

function QuizResult({
  attempt, result, onDone,
}: {
  attempt: ApiQuizAttemptDetail;
  result: ApiQuizAttempt;
  onDone: () => void;
}) {
  const pending = result.is_passed === null || result.is_passed === undefined;
  const passed = result.is_passed === true;

  return (
    <div className="max-w-lg mx-auto p-6 md:p-8 text-center py-16">
      <div className={cn(
        'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5',
        pending ? 'bg-gray-100 dark:bg-slate-700' : passed ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'
      )}>
        {pending ? (
          <HelpCircle className="w-8 h-8 text-gray-400" aria-hidden="true" />
        ) : passed ? (
          <PartyPopper className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
        ) : (
          <XCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
        )}
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
        {pending ? 'Submitted — awaiting review' : passed ? 'Nice work, you passed!' : 'Attempt submitted'}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {attempt.quiz.title}
      </p>

      {!pending && (
        <div className="flex items-center justify-center gap-8 mb-8">
          <div>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {result.percentage}%
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Score</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {result.score}/{result.max_score}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Points</div>
          </div>
        </div>
      )}

      {pending && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          One or more questions in this quiz need manual grading. Your final score will
          appear here once that's done.
        </p>
      )}

      <button
        onClick={onDone}
        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
      >
        Back to quizzes
      </button>
    </div>
  );
}