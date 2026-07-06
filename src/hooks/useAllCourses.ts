import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchCourseModules, fetchCoursesByModule, ApiCourseListItem, ApiError } from '../lib/api';

interface UseAllCoursesResult {
  courses: ApiCourseListItem[];
  isLoading: boolean;
  error: string | null;
}

export function useAllCourses(): UseAllCoursesResult {
  const { token } = useAuth();
  const [courses, setCourses] = useState<ApiCourseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchCourseModules(token)
      .then((modules) =>
        Promise.all(modules.map((m) => fetchCoursesByModule(m.id, token)))
      )
      .then((results) => {
        if (!cancelled) setCourses(results.flat());
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Something went wrong');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { courses, isLoading, error };
}