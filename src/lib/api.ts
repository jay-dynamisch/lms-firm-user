const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// ============================================================================
// SHARED
// ============================================================================

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

// ============================================================================
// AUTH
// ============================================================================

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthApiUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  organizationId?: string;
}

export interface LoginResponse {
  token: string;
  user?: AuthApiUser;
  accountType?: string;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafe(response);

  if (!response.ok || body?.success === false) {
    const message = body?.message || body?.error || 'Invalid email or password';
    throw new ApiError(message, response.status);
  }

  const payloadData = body?.data ?? body;

  const token =
    payloadData?.access_token || payloadData?.token || payloadData?.accessToken;

  if (!token) {
    throw new ApiError('Login succeeded but no token was returned', response.status);
  }

  return {
    token,
    user: payloadData?.user,
    accountType: payloadData?.account_type,
  };
}

// ============================================================================
// ORGANIZATION / USER STATS
// ============================================================================

export interface OrgUserStats {
  total_users: number;
  active_users: number;
  suspended_users: number;
  deleted_users: number;
}

export async function fetchOrgUserStats(
  organizationId: string,
  token: string
): Promise<OrgUserStats> {
  const response = await fetch(`${API_BASE_URL}/orgs/${organizationId}/users/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await parseJsonSafe(response);

  if (!response.ok || body?.success === false) {
    const message = body?.message || 'Failed to load organization stats';
    throw new ApiError(message, response.status);
  }

  return (body?.data ?? body) as OrgUserStats;
}


export interface ApiLesson {
  id: string;
  course_id: string;
  title: string;
  content?: string;
  video_url?: string;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface ApiCourseModule {
  id: string;
  title: string;
  description?: string;
  sequence_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApiCourseDetail {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  price?: number;
  category?: string;
  course_module_id: string;
  created_by: string;
  status: string;
  created_at: string;
  updated_at: string;
  course_module?: ApiCourseModule;
  lessons?: ApiLesson[];
}

export async function fetchCourseDetail(
  moduleId: string,
  courseId: string,
  token: string
): Promise<ApiCourseDetail> {
  const response = await fetch(
    `${API_BASE_URL}/courses/modules/${moduleId}/courses/${courseId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const body = await parseJsonSafe(response);

  if (!response.ok) {
    throw new ApiError(body?.message || 'Failed to load course', response.status);
  }

  return (body?.data ?? body) as ApiCourseDetail;
}

export interface ApiCourseListItem {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  price?: number;
  category?: string;
  course_module_id: string;
  created_by: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function fetchCourseModules(token: string): Promise<ApiCourseModule[]> {
  const response = await fetch(`${API_BASE_URL}/courses/modules?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new ApiError(body?.message || 'Failed to load course modules', response.status);
  }
  const payload = body?.data ?? body;
  return payload?.data ?? payload ?? [];
}

export async function fetchCoursesByModule(
  moduleId: string,
  token: string
): Promise<ApiCourseListItem[]> {
  const response = await fetch(`${API_BASE_URL}/courses/modules/${moduleId}/courses?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new ApiError(body?.message || 'Failed to load courses', response.status);
  }
  const payload = body?.data ?? body;
  return payload?.data ?? payload ?? [];
}

export interface ApiCourseModuleWithCount extends ApiCourseModule {
  courseCount: number;
}

export async function fetchCourseModulesWithCounts(
  token: string
): Promise<ApiCourseModuleWithCount[]> {
  const modules = await fetchCourseModules(token);
  const withCounts = await Promise.all(
    modules.map(async (m) => {
      const courses = await fetchCoursesByModule(m.id, token);
      return { ...m, courseCount: courses.length };
    })
  );
  return withCounts;
}

// ============================================================================
// QUIZZES
// ============================================================================

export interface ApiQuizListItem {
  id: string;
  title: string;
  description?: string;
  quiz_type?: string;
  time_limit_secs?: number;
  pass_threshold?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_answers_after?: string;
  status: string;
  question_count: number;
  created_at: string;
  updated_at: string;
}

// Never carries is_correct here — the backend only reveals that on a
// graded/reviewed attempt. See QuizService.mapQuestionToResponse server-side.
export interface ApiQuestionOption {
  id: string;
  text: string;
  sort_order: number;
  is_correct?: boolean;
}

export interface ApiQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  explanation?: string;
  points: number;
  sort_order: number;
  media_url?: string;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  options?: ApiQuestionOption[];
}

export interface ApiQuizDetail extends ApiQuizListItem {
  organization_id: string;
  questions: ApiQuestion[];
}

export interface ApiQuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  attempt_number: number;
  score?: number;
  max_score?: number;
  percentage?: number;
  is_passed?: boolean | null;
  started_at: string;
  submitted_at?: string;
  time_spent_secs?: number;
}

// Returned by /attempts/start — includes the full quiz + questions the
// student needs to actually take the quiz.
export interface ApiQuizAttemptDetail extends ApiQuizAttempt {
  quiz: ApiQuizDetail;
  answers: ApiQuizAttemptAnswer[];
}

export interface ApiQuizAttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_options: string[];
  text_answer?: string;
  is_correct?: boolean | null;
  score_earned?: number;
}

export async function fetchQuizzes(token: string): Promise<ApiQuizListItem[]> {
  const response = await fetch(`${API_BASE_URL}/quizzes?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new ApiError(body?.message || 'Failed to load quizzes', response.status);
  }
  const payload = body?.data ?? body;
  return payload?.data ?? payload ?? [];
}

export async function fetchQuizDetail(quizId: string, token: string): Promise<ApiQuizDetail> {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new ApiError(body?.message || 'Failed to load quiz', response.status);
  }
  return (body?.data ?? body) as ApiQuizDetail;
}

export async function startQuizAttempt(
  quizId: string,
  token: string
): Promise<ApiQuizAttemptDetail> {
  const response = await fetch(`${API_BASE_URL}/quizzes/attempts/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quiz_id: quizId }),
  });
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new ApiError(body?.message || 'Failed to start attempt', response.status);
  }
  return (body?.data ?? body) as ApiQuizAttemptDetail;
}

export interface SubmitAnswerPayload {
  question_id: string;
  selected_options?: string[];
  text_answer?: string;
}

export async function submitQuizAnswer(
  attemptId: string,
  payload: SubmitAnswerPayload,
  token: string
): Promise<{ success: boolean; answerId: string }> {
  const response = await fetch(`${API_BASE_URL}/quizzes/attempts/${attemptId}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new ApiError(body?.message || 'Failed to save answer', response.status);
  }
  return (body?.data ?? body) as { success: boolean; answerId: string };
}

export async function submitQuizAttempt(
  attemptId: string,
  token: string
): Promise<ApiQuizAttempt> {
  const response = await fetch(`${API_BASE_URL}/quizzes/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new ApiError(body?.message || 'Failed to submit quiz', response.status);
  }
  return (body?.data ?? body) as ApiQuizAttempt;
}

export interface EnrollResponse {
  id: string;
  user_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'dropped';
  enrolled_at: string;
  completed_at?: string;
}

export async function enrollInCourse(courseId: string): Promise<EnrollResponse> {
  const res = await fetch('/api/enrollments', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_id: courseId }),
  });

  if (res.status === 409) {
    return res.json().catch(() => ({} as EnrollResponse));
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || 'Failed to enroll in course');
  }

  return res.json();
}