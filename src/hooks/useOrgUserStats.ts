import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchOrgUserStats, OrgUserStats, ApiError } from '../lib/api';

interface UseOrgUserStatsResult {
  stats: OrgUserStats | null;
  isLoading: boolean;
  error: string | null;
}

export function useOrgUserStats(): UseOrgUserStatsResult {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<OrgUserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user?.organizationId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchOrgUserStats(user.organizationId, token)
      .then((data) => {
        if (!cancelled) setStats(data);
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
  }, [token, user?.organizationId]);

  return { stats, isLoading, error };
}