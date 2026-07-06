import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchCourseModulesWithCounts,
  ApiCourseModuleWithCount,
  ApiError,
} from '../lib/api';

interface UseCourseModulesResult {
  modules: ApiCourseModuleWithCount[];
  isLoading: boolean;
  error: string | null;
}

export function useCourseModules(): UseCourseModulesResult {
  const { token } = useAuth();
  const [modules, setModules] = useState<ApiCourseModuleWithCount[]>([]);
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

    fetchCourseModulesWithCounts(token)
      .then((data) => {
        if (!cancelled) setModules(data);
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

  return { modules, isLoading, error };
}