import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchQuizDetail, ApiQuizDetail, ApiError } from '../lib/api';

interface UseQuizDetailResult {
  quiz: ApiQuizDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function useQuizDetail(quizId: string | undefined): UseQuizDetailResult {
  const { token } = useAuth();
  const [quiz, setQuiz] = useState<ApiQuizDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !quizId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchQuizDetail(quizId, token)
      .then((data) => {
        if (!cancelled) setQuiz(data);
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
  }, [token, quizId]);

  return { quiz, isLoading, error };
}