import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchQuizAttempts, ApiQuizAttempt, ApiError } from '../lib/api';

interface UseQuizAttemptsResult {
  attempts: ApiQuizAttempt[];
  isLoading: boolean;
  error: string | null;
}

export function useQuizAttempts(quizId: string | undefined): UseQuizAttemptsResult {
  const { token, user } = useAuth();
  const [attempts, setAttempts] = useState<ApiQuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !quizId || !user?.id) {
      setAttempts([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchQuizAttempts(quizId, user.id, 1, 20, token)
      .then((data) => {
        if (!cancelled) setAttempts(data.data || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load quiz attempts');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, quizId, user?.id]);

  return { attempts, isLoading, error };
}
