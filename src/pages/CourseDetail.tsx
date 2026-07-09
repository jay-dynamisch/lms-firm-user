import React, { useMemo, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  PlayCircle,
  FileText,
  Clock,
  BookOpen,
  Tag,
  Search,
  X,
  DollarSign,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { useCourseDetail } from '../hooks/useCourseDetail';
import { ApiLesson, enrollInCourse } from '../lib/api';
import { CourseFeedbackForm } from './CourseFeedbackForm';

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Backend has no `type` field on lessons — infer video vs. reading
 * from whether video_url is present.
 */
const useLessonKind = (lesson: ApiLesson): 'video' | 'reading' => {
  return lesson.video_url ? 'video' : 'reading';
};

const useFilteredLessons = (lessons: ApiLesson[], searchTerm: string): ApiLesson[] => {
  return useMemo(() => {
    if (!searchTerm.trim()) return lessons;
    const lower = searchTerm.toLowerCase();
    return lessons.filter((l) => l.title.toLowerCase().includes(lower));
  }, [lessons, searchTerm]);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<string, string> = {
    published: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
    draft: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400',
    archived: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400',
  };
  return (
    <span
      className={cn(
        'text-xs font-semibold px-2.5 py-1 rounded-full capitalize',
        styles[status] || styles.draft
      )}
    >
      {status}
    </span>
  );
};

interface LessonRowProps {
  lesson: ApiLesson;
  moduleId: string;
  courseId: string;
  index: number;
}

const LessonRow: React.FC<LessonRowProps> = ({ lesson, moduleId, courseId, index }) => {
  const kind = useLessonKind(lesson);
  const Icon = kind === 'video' ? PlayCircle : FileText;

  return (
    <Link
      to={`/courses/${moduleId}/${courseId}/lessons/${lesson.id}`}
      className={cn(
        'flex items-center justify-between px-6 py-4 transition-colors',
        'hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 rounded'
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-indigo-100 dark:bg-indigo-500/20 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/30 transition-colors">
          <Icon className="w-4 h-4 text-indigo-500" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
            {index + 1}. {lesson.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
            {kind}
          </p>
        </div>
      </div>
      <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3">
        Open
      </span>
    </Link>
  );
};

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClear: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange, onClear }) => {
  return (
    <div className="relative mb-8">
      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Search lessons..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className={cn(
          'w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-800',
          'border border-gray-200 dark:border-slate-700 rounded-lg',
          'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400',
          'transition-colors'
        )}
        aria-label="Search lessons by title"
      />
      {searchTerm && (
        <button
          onClick={onClear}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Clear search"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="p-12 text-center text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
    Loading course…
  </div>
);

interface ErrorStateProps {
  message: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message }) => (
  <div className="p-12 text-center text-red-500 dark:text-red-400" role="alert" aria-live="polite">
    {message}
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CourseDetail() {
  const { moduleId, courseId } = useParams<{ moduleId: string; courseId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const { course, isLoading, error } = useCourseDetail(moduleId, courseId);

  const lessons = useMemo(
    () => [...(course?.lessons || [])].sort((a, b) => a.sequence_order - b.sequence_order),
    [course?.lessons]
  );
  const filteredLessons = useFilteredLessons(lessons, searchTerm);

  const firstLessonId = lessons[0]?.id;

  const handleSearchChange = useCallback((term: string) => setSearchTerm(term), []);
  const handleClearSearch = useCallback(() => setSearchTerm(''), []);
  const handleNavigateBack = useCallback(() => navigate(-1), [navigate]);

  const handleStartCourse = useCallback(async () => {
    if (!course || !firstLessonId) return;

    setEnrollError(null);
    setIsEnrolling(true);
    try {
      await enrollInCourse(course.id);
      navigate(`/courses/${course.course_module_id}/${course.id}/lessons/${firstLessonId}`);
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'Failed to enroll in course');
    } finally {
      setIsEnrolling(false);
    }
  }, [course, firstLessonId, navigate]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!course) return <ErrorState message="Course not found." />;

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-6 py-8 md:py-12">
          <button
            onClick={handleNavigateBack}
            className={cn(
              'flex items-center gap-2 text-sm font-medium',
              'text-gray-500 dark:text-gray-400',
              'hover:text-gray-900 dark:hover:text-white',
              'transition-colors mb-6',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-2 py-1'
            )}
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start">
            <div className="md:col-span-2 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                {course.category && (
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                    {course.category}
                  </span>
                )}
                <StatusBadge status={course.status} />
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {course.title}
              </h1>

              {course.description && (
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {course.description}
                </p>
              )}

              {course.course_module?.title && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Part of{' '}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {course.course_module.title}
                  </span>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 pt-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  <span>{lessons.length} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  <span>Added {format(parseISO(course.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 dark:bg-indigo-500" />

              {typeof course.price === 'number' && (
                <div className="flex items-center gap-2 mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                  <DollarSign className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                  {course.price === 0 ? 'Free' : course.price.toFixed(2)}
                </div>
              )}

              {firstLessonId ? (
                <>
                  <button
                    onClick={handleStartCourse}
                    disabled={isEnrolling}
                    className={cn(
                      'w-full flex items-center justify-center gap-2',
                      'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600',
                      'disabled:opacity-60 disabled:cursor-not-allowed',
                      'text-white font-semibold py-3 px-4 rounded-xl',
                      'transition-colors shadow-sm',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
                    )}
                    aria-busy={isEnrolling}
                  >
                    {isEnrolling ? 'Enrolling…' : 'Start Course'}
                    <PlayCircle className="w-5 h-5" aria-hidden="true" />
                  </button>
                  {enrollError && (
                    <p
                      className="text-sm text-red-500 dark:text-red-400 mt-3 text-center"
                      role="alert"
                    >
                      {enrollError}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  No lessons published yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Section */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Course Curriculum
          </h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
          </span>
        </div>

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onClear={handleClearSearch}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm"
        >
          {filteredLessons.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredLessons.map((lesson, i) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  moduleId={course.course_module_id}
                  courseId={course.id}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div
              className="p-8 text-center text-gray-500 dark:text-gray-400"
              role="status"
              aria-live="polite"
            >
              {searchTerm
                ? `No lessons found matching "${searchTerm}"`
                : 'No lessons in this course yet.'}
            </div>
          )}
        </motion.div>

        {searchTerm && filteredLessons.length === 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            Try adjusting your search terms or{' '}
            <button
              onClick={handleClearSearch}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              clear the search
            </button>
          </div>
        )}

        {/* Feedback */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Your Feedback
          </h2>
          <CourseFeedbackForm courseId={course.id} />
        </div>
      </div>
    </div>
  );
}