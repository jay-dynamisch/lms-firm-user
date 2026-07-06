import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ClipboardList, HelpCircle, Clock, Repeat, Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { useQuizzes } from '../hooks/useQuizzes';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

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

const EmptyState: React.FC = () => (
  <div className="text-center py-20">
    <div className="bg-gray-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
      <ClipboardList className="w-8 h-8 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No quizzes yet</h3>
    <p className="text-gray-500 dark:text-gray-400 mt-1">
      Quizzes will show up here once they're created.
    </p>
  </div>
);

export default function Quizzes() {
  const { quizzes, isLoading, error } = useQuizzes();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Quizzes
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Test your knowledge with quizzes from your organization.
        </p>
      </div>

      {isLoading && (
        <div className="py-20 text-center text-gray-400 dark:text-gray-500">Loading quizzes…</div>
      )}

      {error && !isLoading && (
        <div className="py-20 text-center text-red-500 dark:text-red-400">{error}</div>
      )}

      {!isLoading && !error && (
        quizzes.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {quizzes.map((quiz) => (
              <motion.div variants={cardVariants} key={quiz.id}>
                <Link to={`/quizzes/${quiz.id}`} className="block group h-full">
                  <article className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 h-full flex flex-col hover:shadow-md dark:hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                      </div>
                      <StatusBadge status={quiz.status} />
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {quiz.title}
                    </h3>

                    {quiz.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                        {quiz.description}
                      </p>
                    )}

                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        {quiz.question_count} {quiz.question_count === 1 ? 'question' : 'questions'}
                      </span>
                      {typeof quiz.time_limit_secs === 'number' && quiz.time_limit_secs > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          {Math.round(quiz.time_limit_secs / 60)} min
                        </span>
                      )}
                      {typeof quiz.max_attempts === 'number' && (
                        <span className="flex items-center gap-1">
                          <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
                          {quiz.max_attempts} {quiz.max_attempts === 1 ? 'attempt' : 'attempts'}
                        </span>
                      )}
                      {typeof quiz.pass_threshold === 'number' && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" aria-hidden="true" />
                          {quiz.pass_threshold}% to pass
                        </span>
                      )}
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <EmptyState />
        )
      )}
    </div>
  );
}