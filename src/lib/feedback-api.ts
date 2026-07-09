// src/lib/feedback-api.ts
//
// Feedback API client — mirrors the request pattern used in lib/api.ts:
// base URL from VITE_API_URL, Bearer token auth, ApiError, parseJsonSafe.

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseJsonSafe(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export interface ApiFeedback {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiFeedbackDetail extends ApiFeedback {
  user: { id: string; name: string; email: string };
  course: { id: string; title: string };
}

export interface ApiFeedbackListResponse {
  data: ApiFeedback[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiFeedbackAnalytics {
  total_feedback: number;
  average_rating: number;
  rating_distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface SubmitFeedbackPayload {
  course_id: string;
  rating: number;
  comment?: string;
}

export interface FeedbackFilters {
  course_id?: string;
  user_id?: string;
  min_rating?: number;
  max_rating?: number;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

async function feedbackFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const body = await parseJsonSafe(response);

  if (!response.ok || body?.success === false) {
    const message = body?.message || body?.error || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (body?.data ?? body) as T;
}

/** Student submits feedback for a course they've taken. */
export async function submitCourseFeedback(
  payload: SubmitFeedbackPayload,
  token: string,
): Promise<ApiFeedback> {
  return feedbackFetch<ApiFeedback>('/feedback', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Any authenticated user — fetches the caller's own feedback, optionally
 * scoped to a single course. Backed by GET /api/feedback/mine, which is
 * always filtered server-side to the caller's own userId.
 */
export async function fetchMyFeedback(
  courseId: string | undefined,
  token: string,
): Promise<ApiFeedback[]> {
  const qs = courseId ? `?course_id=${encodeURIComponent(courseId)}` : '';
  return feedbackFetch<ApiFeedback[]>(`/feedback/mine${qs}`, token);
}

/** Author edits their own feedback (or admin moderates any). */
export async function updateCourseFeedback(
  feedbackId: string,
  payload: { rating?: number; comment?: string },
  token: string,
): Promise<ApiFeedback> {
  return feedbackFetch<ApiFeedback>(`/feedback/${feedbackId}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/** Author deletes their own feedback (or admin moderates any). */
export async function deleteCourseFeedback(feedbackId: string, token: string): Promise<void> {
  return feedbackFetch<void>(`/feedback/${feedbackId}`, token, { method: 'DELETE' });
}

/** org_admin / superadmin only. */
export async function fetchFeedbackList(
  filters: FeedbackFilters = {},
  token: string,
): Promise<ApiFeedbackListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return feedbackFetch<ApiFeedbackListResponse>(`/feedback${qs ? `?${qs}` : ''}`, token);
}

/** org_admin / superadmin only. */
export async function fetchFeedbackAnalytics(
  courseId: string | undefined,
  token: string,
): Promise<ApiFeedbackAnalytics> {
  const qs = courseId ? `?course_id=${encodeURIComponent(courseId)}` : '';
  return feedbackFetch<ApiFeedbackAnalytics>(`/feedback/analytics${qs}`, token);
}

/** org_admin / superadmin only. */
export async function fetchFeedbackDetail(
  feedbackId: string,
  token: string,
): Promise<ApiFeedbackDetail> {
  return feedbackFetch<ApiFeedbackDetail>(`/feedback/${feedbackId}`, token);
}