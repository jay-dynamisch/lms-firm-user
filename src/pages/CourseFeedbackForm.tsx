import React, { useEffect, useState } from 'react';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import {
  ApiFeedback,
  ApiError,
  fetchMyFeedback,
  submitCourseFeedback,
  updateCourseFeedback,
} from '../lib/feedback-api';

interface CourseFeedbackFormProps {
  courseId: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

export const CourseFeedbackForm: React.FC<CourseFeedbackFormProps> = ({ courseId }) => {
  const { token } = useAuth();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [existingFeedback, setExistingFeedback] = useState<ApiFeedback | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

  // Load the student's own prior feedback for this course, if any, so the
  // form pre-fills instead of always looking blank / silently 409ing on resubmit.
  useEffect(() => {
    if (!token || !courseId) {
      setIsLoadingExisting(false);
      return;
    }

    let cancelled = false;
    setIsLoadingExisting(true);

    fetchMyFeedback(courseId, token)
      .then((list) => {
        if (cancelled) return;
        const mine = list[0] ?? null;
        setExistingFeedback(mine);
        if (mine) {
          setRating(mine.rating);
          setComment(mine.comment ?? '');
        }
      })
      .catch(() => {
        // Non-fatal: just fall back to a blank form.
      })
      .finally(() => {
        if (!cancelled) setIsLoadingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, courseId]);

  const displayRating = hoverRating || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You need to be signed in to submit feedback.');
      return;
    }
    if (rating === 0) {
      setError('Please select a rating before submitting.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      if (existingFeedback) {
        const updated = await updateCourseFeedback(
          existingFeedback.id,
          { rating, comment: comment.trim() || undefined },
          token,
        );
        setExistingFeedback(updated);
      } else {
        const created = await submitCourseFeedback(
          { course_id: courseId, rating, comment: comment.trim() || undefined },
          token,
        );
        setExistingFeedback(created);
      }
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong submitting your feedback. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingExisting) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        Loading your feedback…
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 flex items-start gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Thanks for your feedback!</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your review helps us improve this course.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6"
    >
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
        {existingFeedback ? 'Update your rating' : 'Rate this course'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {existingFeedback
          ? 'You already reviewed this course — feel free to update it below.'
          : 'Let us know what you thought — your feedback is shared with the course team.'}
      </p>

      <div className="flex items-center gap-1 mb-2" role="radiogroup" aria-label="Course rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value > 1 ? 's' : ''} - ${RATING_LABELS[value]}`}
            onClick={() => setRating(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            <Star
              className={cn(
                'w-7 h-7 transition-colors',
                value <= displayRating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300 dark:text-slate-600',
              )}
            />
          </button>
        ))}
        {displayRating > 0 && (
          <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            {RATING_LABELS[displayRating]}
          </span>
        )}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share more about your experience (optional)"
        rows={3}
        maxLength={2000}
        className={cn(
          'w-full mt-3 px-3 py-2 bg-white dark:bg-slate-900',
          'border border-gray-200 dark:border-slate-700 rounded-lg text-sm',
          'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none',
        )}
      />

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 mt-2" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !token}
        className={cn(
          'mt-4 inline-flex items-center gap-2',
          'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          'text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors',
        )}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {isSubmitting
          ? existingFeedback
            ? 'Updating…'
            : 'Submitting…'
          : existingFeedback
            ? 'Update feedback'
            : 'Submit feedback'}
      </button>
    </form>
  );
};