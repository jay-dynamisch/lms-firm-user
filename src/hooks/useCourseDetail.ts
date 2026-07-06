import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchCourseDetail, ApiCourseDetail, ApiError } from '../lib/api';

interface UseCourseDetailResult {
  course: ApiCourseDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function useCourseDetail(
  moduleId: string | undefined,
  courseId: string | undefined
): UseCourseDetailResult {
  const { token } = useAuth();
  const [course, setCourse] = useState<ApiCourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !moduleId || !courseId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchCourseDetail(moduleId, courseId, token)
      .then((data) => {
        if (!cancelled) setCourse(data);
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
  }, [token, moduleId, courseId]);

  return { course, isLoading, error };
}