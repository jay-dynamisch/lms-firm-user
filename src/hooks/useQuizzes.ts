import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchQuizzes, ApiQuizListItem, ApiError } from '../lib/api';

interface UseQuizzesResult {
  quizzes: ApiQuizListItem[];
  isLoading: boolean;
  error: string | null;
}

export function useQuizzes(): UseQuizzesResult {
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState<ApiQuizListItem[]>([]);
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

    fetchQuizzes(token)
      .then((data) => {
        if (!cancelled) setQuizzes(data);
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

  return { quizzes, isLoading, error };
}