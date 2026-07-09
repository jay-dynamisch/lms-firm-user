import React, { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, Clock, Repeat, Target, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useQuizDetail } from '../hooks/useQuizDetail';
import { useQuizAttempts } from '../hooks/useQuizAttempts';

export default function QuizDetail() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { quiz, isLoading, error } = useQuizDetail(quizId);
  const { attempts, isLoading: isAttemptsLoading, error: attemptsError } = useQuizAttempts(quizId);

  const [isStarting, setIsStarting] = useState(false);

  // NOTE: this no longer calls startQuizAttempt itself. QuizAttempt.tsx
  // calls it on mount — starting it here too would burn two attempts
  // (against max_attempts) for a single click. This just navigates.
  const handleStart = useCallback(() => {
    if (!token || !quizId) return;
    setIsStarting(true);
    navigate(`/quizzes/${quizId}/attempt`);
  }, [token, quizId, navigate]);

  if (isLoading) {
    return <div className="p-12 text-center text-gray-400 dark:text-gray-500">Loading quiz…</div>;
  }

  if (error || !quiz) {
    return (
      <div className="p-12 text-center text-red-500 dark:text-red-400">
        {error || 'Quiz not found'}
      </div>
    );
  }

  const sortedQuestions = [...quiz.questions].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="pb-20">
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 space-y-4">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {quiz.title}
              </h1>
              {quiz.description && (
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {quiz.description}
                </p>
              )}

              <div className="space-y-6">
                <div className="rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 p-5">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Your attempts</h2>
                  {isAttemptsLoading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading attempts…</p>
                  ) : attemptsError ? (
                    <p className="text-sm text-red-500 dark:text-red-400">{attemptsError}</p>
                  ) : attempts.length > 0 ? (
                    <div className="space-y-3">
                      {attempts.map((attempt) => (
                        <div
                          key={attempt.id}
                          className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                Attempt {attempt.attempt_number}
                                {attempt.submitted_at ? ` · ${new Date(attempt.submitted_at).toLocaleString()}` : ' · In progress'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {attempt.score}/{attempt.max_score} points · {attempt.percentage}%
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className={cn(
                                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                                attempt.is_passed === true
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                                  : attempt.is_passed === false
                                  ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200'
                                  : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
                              )}>
                                {attempt.is_passed === true
                                  ? 'Passed'
                                  : attempt.is_passed === false
                                  ? 'Failed'
                                  : 'Pending review'}
                              </span>
                              <button
                                type="button"
                                onClick={() => navigate(`/quizzes/${quizId}/attempt/${attempt.id}`)}
                                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors"
                              >
                                Review
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">You have not attempted this quiz yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" aria-hidden="true" />
                  {sortedQuestions.length} questions
                </span>
                {typeof quiz.time_limit_secs === 'number' && quiz.time_limit_secs > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    {Math.round(quiz.time_limit_secs / 60)} min limit
                  </span>
                )}
                {typeof quiz.max_attempts === 'number' && (
                  <span className="flex items-center gap-1.5">
                    <Repeat className="w-4 h-4" aria-hidden="true" />
                    {quiz.max_attempts} {quiz.max_attempts === 1 ? 'attempt' : 'attempts'} allowed
                  </span>
                )}
                {typeof quiz.pass_threshold === 'number' && (
                  <span className="flex items-center gap-1.5">
                    <Target className="w-4 h-4" aria-hidden="true" />
                    {quiz.pass_threshold}% to pass
                  </span>
                )}
              </div>

            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
              <button
                onClick={handleStart}
                disabled={isStarting || sortedQuestions.length === 0}
                className={cn(
                  'w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600',
                  'text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm',
                  (isStarting || sortedQuestions.length === 0) && 'opacity-60 cursor-not-allowed'
                )}
              >
                {isStarting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {isStarting ? 'Starting…' : 'Start quiz'}
              </button>
              {sortedQuestions.length === 0 && (
                <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
                  This quiz has no questions yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Questions</h2>

        {sortedQuestions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {sortedQuestions.map((q, i) => (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex items-start gap-3"
              >
                <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {q.question_text}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 capitalize">
                    {q.question_type.replace('_', ' ')} • {q.points} {q.points === 1 ? 'point' : 'points'}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">No questions added yet.</p>
        )}
      </div>
    </div>
  );
}