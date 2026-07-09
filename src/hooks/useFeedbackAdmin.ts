import { useState, useEffect, useCallback } from 'react';
import {
  fetchFeedbackList,
  fetchFeedbackAnalytics,
  ApiFeedback,
  ApiFeedbackAnalytics,
  ApiFeedbackListResponse,
  FeedbackFilters,
} from '../lib/feedback-api';

/**
 * org_admin / superadmin only — pulls the paginated feedback list and the
 * matching analytics summary together, refetching whenever filters change.
 */
export function useFeedbackAdmin(initialFilters: FeedbackFilters = {}) {
  const [filters, setFilters] = useState<FeedbackFilters>({
    page: 1,
    limit: 20,
    ...initialFilters,
  });
  const [feedback, setFeedback] = useState<ApiFeedback[]>([]);
  const [pagination, setPagination] = useState<ApiFeedbackListResponse['pagination'] | null>(null);
  const [analytics, setAnalytics] = useState<ApiFeedbackAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [list, stats] = await Promise.all([
        fetchFeedbackList(filters),
        fetchFeedbackAnalytics(filters.course_id),
      ]);
      setFeedback(list.data);
      setPagination(list.pagination);
      setAnalytics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilters = useCallback((partial: Partial<FeedbackFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial, page: partial.page ?? 1 }));
  }, []);

  return {
    feedback,
    pagination,
    analytics,
    isLoading,
    error,
    filters,
    updateFilters,
    refetch: load,
  };
}