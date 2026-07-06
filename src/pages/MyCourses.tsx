import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Search, X, Tag } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAllCourses } from '../hooks/useAllCourses';
import { ApiCourseListItem } from '../lib/api';

// ============================================================================
// TYPES
// ============================================================================

type TabType = 'all' | 'published' | 'draft' | 'archived';

interface Tab {
  id: TabType;
  label: string;
}

const tabs: Tab[] = [
  { id: 'all', label: 'All Courses' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' },
  { id: 'archived', label: 'Archived' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

// ============================================================================
// HOOKS
// ============================================================================

const useFilteredCourses = (
  allCourses: ApiCourseListItem[],
  activeTab: TabType,
  searchTerm: string
): ApiCourseListItem[] => {
  return useMemo(() => {
    let filtered = allCourses;

    if (activeTab !== 'all') {
      filtered = filtered.filter((course) => course.status === activeTab);
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(lower) ||
          (course.category || '').toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [allCourses, activeTab, searchTerm]);
};

const useCourseCounts = (courses: ApiCourseListItem[]) => {
  return useMemo(
    () => ({
      all: courses.length,
      published: courses.filter((c) => c.status === 'published').length,
      draft: courses.filter((c) => c.status === 'draft').length,
      archived: courses.filter((c) => c.status === 'archived').length,
    }),
    [courses]
  );
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

interface CourseCardProps {
  course: ApiCourseListItem;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <motion.div variants={cardVariants}>
      <Link to={`/courses/${course.course_module_id}/${course.id}`} className="block group h-full">
        <article className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md dark:hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-200 h-full flex flex-col focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900">
          <div className="h-32 w-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-indigo-300 dark:text-indigo-500/40" aria-hidden="true" />
          </div>

          <div className="p-5 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-2">
              {course.category ? (
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Tag className="w-3 h-3" aria-hidden="true" />
                  {course.category}
                </span>
              ) : (
                <span />
              )}
              <StatusBadge status={course.status} />
            </div>

            <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {course.title}
            </h3>

            {course.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                {course.description}
              </p>
            )}

            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-700 text-sm font-medium text-gray-500 dark:text-gray-400">
              {typeof course.price === 'number'
                ? course.price === 0
                  ? 'Free'
                  : `$${course.price.toFixed(2)}`
                : 'View course'}
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
};

interface TabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  counts: Record<TabType, number>;
}

const TabsBar: React.FC<TabsProps> = ({ activeTab, onTabChange, counts }) => {
  return (
    <div className="border-b border-gray-200 dark:border-slate-700 mb-6 overflow-x-auto hide-scrollbar">
      <div className="flex space-x-8 min-w-max px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'pb-4 text-sm font-medium transition-colors relative',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded',
              activeTab === tab.id
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className="ml-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                ({counts[tab.id]})
              </span>
            )}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeCourseTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClear: () => void;
}

const SearchBarComponent: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange, onClear }) => {
  return (
    <div className="mb-6">
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search by title or category..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-800',
            'border border-gray-200 dark:border-slate-700 rounded-lg text-sm',
            'text-gray-900 dark:text-white',
            'placeholder-gray-500 dark:placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
            'dark:focus:border-indigo-500 transition-all'
          )}
        />
        {searchTerm && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded p-1"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ hasSearch: boolean }> = ({ hasSearch }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
    <div className="bg-gray-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
      <BookOpen className="w-8 h-8 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
      {hasSearch ? 'No courses found' : 'No courses available'}
    </h3>
    <p className="text-gray-500 dark:text-gray-400 mt-1">
      {hasSearch ? 'Try adjusting your search terms' : 'Check back soon for new courses'}
    </p>
  </motion.div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyCourses() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { courses, isLoading, error } = useAllCourses();
  const filteredCourses = useFilteredCourses(courses, activeTab, searchTerm);
  const counts = useCourseCounts(courses);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSearchTerm('');
  }, []);

  const handleSearchChange = useCallback((term: string) => setSearchTerm(term), []);
  const handleClearSearch = useCallback(() => setSearchTerm(''), []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Courses
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Browse available courses in your organization.
        </p>
      </div>

      {isLoading && (
        <div className="py-20 text-center text-gray-400 dark:text-gray-500">Loading courses…</div>
      )}

      {error && !isLoading && (
        <div className="py-20 text-center text-red-500 dark:text-red-400">{error}</div>
      )}

      {!isLoading && !error && (
        <>
          <SearchBarComponent
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onClear={handleClearSearch}
          />

          <TabsBar activeTab={activeTab} onTabChange={handleTabChange} counts={counts} />

          {filteredCourses.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              key={`${activeTab}-${searchTerm}`}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </motion.div>
          ) : (
            <EmptyState hasSearch={searchTerm.length > 0} />
          )}
        </>
      )}
    </div>
  );
}