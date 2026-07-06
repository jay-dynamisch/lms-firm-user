import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Layers, ChevronDown, BookOpen, Hash } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useCourseModules } from '../hooks/useCourseModules';
import { fetchCoursesByModule, ApiCourseListItem } from '../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
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

interface ModuleCoursesListProps {
  moduleId: string;
}

const ModuleCoursesList: React.FC<ModuleCoursesListProps> = ({ moduleId }) => {
  const { token } = useAuth();
  const [courses, setCourses] = useState<ApiCourseListItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchCoursesByModule(moduleId, token)
      .then((data) => {
        if (!cancelled) setCourses(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId, token]);

  if (isLoading) {
    return <p className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">Loading courses…</p>;
  }

  if (!courses || courses.length === 0) {
    return <p className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">No courses in this module yet.</p>;
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-slate-700">
      {courses.map((course) => (
        <Link
          key={course.id}
          to={`/courses/${moduleId}/${course.id}`}
          className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
        >
          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
            {course.title}
          </span>
          <StatusBadge status={course.status} />
        </Link>
      ))}
    </div>
  );
};

interface ModuleCardProps {
  module: {
    id: string;
    title: string;
    description?: string;
    sequence_order?: number;
    status: string;
    courseCount: number;
  };
  isExpanded: boolean;
  onToggle: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module, isExpanded, onToggle }) => {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5 text-indigo-500" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-bold text-gray-900 dark:text-white">{module.title}</h3>
            <StatusBadge status={module.status} />
          </div>
          {module.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
              {module.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              {module.courseCount} {module.courseCount === 1 ? 'course' : 'courses'}
            </span>
            {typeof module.sequence_order === 'number' && (
              <span className="flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" aria-hidden="true" />
                Order {module.sequence_order}
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0 transition-transform',
            isExpanded && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 dark:border-slate-700 overflow-hidden"
          >
            <ModuleCoursesList moduleId={module.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const EmptyState: React.FC = () => (
  <div className="text-center py-20">
    <div className="bg-gray-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
      <Layers className="w-8 h-8 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No modules yet</h3>
    <p className="text-gray-500 dark:text-gray-400 mt-1">
      Course modules will show up here once they're created.
    </p>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Test() {
  const { modules, isLoading, error } = useCourseModules();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const sortedModules = [...modules].sort(
    (a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0)
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Course modules
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Raw view of course_module records from the backend, grouped with their courses.
        </p>
      </div>

      {isLoading && (
        <div className="py-20 text-center text-gray-400 dark:text-gray-500">Loading modules…</div>
      )}

      {error && !isLoading && (
        <div className="py-20 text-center text-red-500 dark:text-red-400">{error}</div>
      )}

      {!isLoading && !error && (
        sortedModules.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {sortedModules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                isExpanded={expandedId === module.id}
                onToggle={() => handleToggle(module.id)}
              />
            ))}
          </motion.div>
        ) : (
          <EmptyState />
        )
      )}
    </div>
  );
}