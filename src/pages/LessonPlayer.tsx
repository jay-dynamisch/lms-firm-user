import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Menu,
  X,
  Circle,
  PlayCircle,
  FileText,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useCourseDetail } from '../hooks/useCourseDetail';

export default function LessonPlayer() {
  const { moduleId, courseId, lessonId } = useParams<{
    moduleId: string;
    courseId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { course, isLoading, error } = useCourseDetail(moduleId, courseId);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-gray-400">
        Loading lesson…
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-red-400">
        {error || 'Course not found'}
      </div>
    );
  }

  const lessons = [...(course.lessons || [])].sort(
    (a, b) => a.sequence_order - b.sequence_order
  );
  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  const currentLesson = lessons[currentIndex];

  if (!currentLesson) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-red-400">
        Lesson not found
      </div>
    );
  }

  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const isVideo = !!currentLesson.video_url;

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Link
            to={`/courses/${course.course_module_id}/${course.id}`}
            className="p-2 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="hidden md:block h-6 w-px bg-gray-700" />
          <h1 className="font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-md">
            {course.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-xs font-medium text-gray-400">
            Lesson {currentIndex + 1} of {lessons.length}
          </span>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-white"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <main
          className={cn(
            'flex-1 flex flex-col transition-all duration-300 ease-in-out h-full overflow-y-auto bg-black',
            isSidebarOpen ? 'md:mr-80' : ''
          )}
        >
          <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">
            {isVideo ? (
              <div className="w-full aspect-video bg-black flex items-center justify-center">
                <video
                  key={currentLesson.id}
                  src={currentLesson.video_url}
                  controls
                  className="w-full h-full"
                >
                  Your browser doesn't support embedded video.
                </video>
              </div>
            ) : (
              <div className="flex-1 bg-white text-gray-900 p-8 md:p-12 overflow-y-auto">
                <div className="max-w-3xl mx-auto prose prose-indigo">
                  <h1 className="text-3xl font-bold mb-6">{currentLesson.title}</h1>
                  {currentLesson.content ? (
                    <div className="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {currentLesson.content}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">
                      No content has been added to this lesson yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gray-900 border-t border-gray-800 p-4 md:p-6 flex items-center justify-between gap-4 mt-auto">
              <button
                disabled={!prevLesson}
                onClick={() =>
                  prevLesson &&
                  navigate(
                    `/courses/${course.course_module_id}/${course.id}/lessons/${prevLesson.id}`
                  )
                }
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 text-gray-300"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                disabled={!nextLesson}
                onClick={() =>
                  nextLesson &&
                  navigate(
                    `/courses/${course.course_module_id}/${course.id}/lessons/${nextLesson.id}`
                  )
                }
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 text-gray-300"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-800 z-10 flex flex-col shadow-2xl md:shadow-none"
            >
              <div className="p-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-10">
                <h2 className="font-bold text-white">Course Content</h2>
                <p className="text-xs text-gray-400 mt-1">{lessons.length} lessons</p>
              </div>

              <div className="flex-1 overflow-y-auto py-2 hide-scrollbar">
                {lessons.map((lesson, i) => {
                  const isActive = lesson.id === lessonId;
                  return (
                    <Link
                      key={lesson.id}
                      to={`/courses/${course.course_module_id}/${course.id}/lessons/${lesson.id}`}
                      className={cn(
                        'px-4 py-3 flex items-start gap-3 transition-colors relative cursor-pointer',
                        isActive ? 'bg-indigo-900/30' : 'hover:bg-gray-800/50'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeLessonIndicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"
                        />
                      )}
                      <div className="mt-0.5 shrink-0">
                        <Circle
                          className={cn('w-4 h-4', isActive ? 'text-indigo-400' : 'text-gray-600')}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium leading-snug mb-1',
                            isActive ? 'text-indigo-300' : 'text-gray-300'
                          )}
                        >
                          {i + 1}. {lesson.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          {lesson.video_url ? (
                            <PlayCircle className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          <span>{lesson.video_url ? 'Video' : 'Reading'}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}