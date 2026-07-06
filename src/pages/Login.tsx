import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { loginRequest, ApiError } from '../lib/api';

// ============================================================================
// TYPES
// ============================================================================

interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface LocationState {
  from?: { pathname: string };
}

// ============================================================================
// VALIDATION
// ============================================================================

const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  return undefined;
};

const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return undefined;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const BrandPanel: React.FC = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900">
      <div className="absolute inset-0 opacity-20" aria-hidden="true">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full border-[40px] border-white" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full border-[24px] border-white translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative z-10 flex flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-2 font-bold text-xl">
          <GraduationCap className="w-7 h-7" aria-hidden="true" />
          <span>Dyna Learning</span>
        </div>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold leading-tight mb-4 max-w-md"
          >
            Pick up right where you left off.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-indigo-100 max-w-sm"
          >
            Your courses, certificates, and progress are all saved and
            waiting for you.
          </motion.p>
        </div>

        <p className="text-xs text-indigo-200">
          © {new Date().getFullYear()} Dyna Learning. All rights reserved.
        </p>
      </div>
    </div>
  );
};

const AuthThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="absolute top-4 right-4 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  );
};

interface TextFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
  onChange: (value: string) => void;
  rightAdornment?: React.ReactNode;
  autoComplete?: string;
}

const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  type,
  value,
  placeholder,
  icon,
  error,
  onChange,
  rightAdornment,
  autoComplete,
}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900',
            'border rounded-lg text-sm text-gray-900 dark:text-white',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
            'dark:focus:border-indigo-500 transition-all',
            rightAdornment ? 'pr-10' : '',
            error
              ? 'border-red-300 dark:border-red-500/50'
              : 'border-gray-200 dark:border-slate-700'
          )}
        />
        {rightAdornment && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightAdornment}
          </span>
        )}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = (location.state as LocationState)?.from?.pathname || '/';

  const [form, setForm] = useState<LoginFormState>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback(
    <K extends keyof LoginFormState>(key: K, value: LoginFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined, general: undefined }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const emailError = validateEmail(form.email);
      const passwordError = validatePassword(form.password);

      if (emailError || passwordError) {
        setErrors({ email: emailError, password: passwordError });
        return;
      }

      setIsSubmitting(true);
      try {
        const { token, user } = await loginRequest({
          email: form.email,
          password: form.password,
        });

        login(token, {
          id: user?.id ?? '',
          email: user?.email ?? form.email,
          name: user?.name,
          role: user?.role ?? 'user',
          organizationId: (user as any)?.organizationId ?? '',
        });

        navigate(from, { replace: true });
      } catch (err) {
        if (err instanceof ApiError) {
          setErrors({ general: err.message });
        } else {
          setErrors({ general: 'Unable to reach the server. Please try again.' });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, login, navigate, from]
  );

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-900 transition-colors duration-200">
      <BrandPanel />

      <div className="relative flex-1 flex items-center justify-center px-6 py-12">
        <AuthThemeToggle />

        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl mb-8">
            <GraduationCap className="w-7 h-7" aria-hidden="true" />
            <span>Dyna Learning</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Sign in to continue your learning.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {errors.general && (
              <div
                role="alert"
                className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg"
              >
                {errors.general}
              </div>
            )}

            <TextField
              id="email"
              label="Email"
              type="email"
              value={form.email}
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" aria-hidden="true" />}
              error={errors.email}
              onChange={(v) => updateField('email', v)}
              autoComplete="email"
            />

            <TextField
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" aria-hidden="true" />}
              error={errors.password}
              onChange={(v) => updateField('password', v)}
              autoComplete="current-password"
              rightAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(e) => updateField('rememberMe', e.target.checked)}
                  className="rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/30"
                />
                Remember me
              </label>
              <button
                type="button"
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold',
                'bg-indigo-600 text-white hover:bg-indigo-700 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
                isSubmitting && 'opacity-70 cursor-not-allowed'
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <button className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}