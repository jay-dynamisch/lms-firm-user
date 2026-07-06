import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type ProgressSize = 'sm' | 'md';
type ProgressColor = 'indigo' | 'green' | 'amber' | 'red';

interface ProgressBarProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Optional CSS class name for the container */
  className?: string;
  /** Tailwind color class (e.g., 'bg-indigo-600') */
  colorClass?: string;
  /** Show the percentage label above the bar */
  showLabel?: boolean;
  /** Size variant */
  size?: ProgressSize;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Optional callback when animation completes */
  onAnimationComplete?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  colorClass = 'bg-indigo-600',
  showLabel = false,
  size = 'md',
  ariaLabel = 'Progress bar',
  onAnimationComplete,
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = useMemo(() => {
    return Math.min(100, Math.max(0, progress));
  }, [progress]);

  // Determine bar height based on size
  const barHeightClass = useMemo(() => {
    return size === 'sm' ? 'h-1.5' : 'h-2.5';
  }, [size]);

  // Accessible label
  const accessibleLabel = `${Math.round(clampedProgress)}% complete`;

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {/* Label Section */}
      {showLabel && (
        <div
          className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400"
          aria-hidden="true"
        >
          <span>Progress</span>
          <span>{clampedProgress}%</span>
        </div>
      )}

      {/* Progress Bar Container */}
      <div
        className={cn(
          'w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden',
          barHeightClass
        )}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        {/* Animated Progress Fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
          }}
          onAnimationComplete={onAnimationComplete}
          className={cn('h-full rounded-full', colorClass)}
          role="presentation"
          aria-hidden="true"
        />
      </div>

      {/* Accessible status text (screen readers only) */}
      <span className="sr-only">{accessibleLabel}</span>
    </div>
  );
};

// ============================================================================
// VARIANTS (PRESET CONFIGURATIONS)
// ============================================================================

/**
 * Course progress variant - commonly used for course completion
 */
interface CourseProgressProps extends Omit<ProgressBarProps, 'colorClass'> {
  variant?: 'in-progress' | 'completed' | 'overdue';
}

export const CourseProgress: React.FC<CourseProgressProps> = ({
  progress,
  variant = 'in-progress',
  ...props
}) => {
  const colorClass = {
    'in-progress': 'bg-indigo-600',
    completed: 'bg-green-600',
    overdue: 'bg-red-600',
  }[variant];

  const label = {
    'in-progress': 'Course progress',
    completed: 'Course completed',
    overdue: 'Course overdue',
  }[variant];

  return (
    <ProgressBar
      {...props}
      progress={progress}
      colorClass={colorClass}
      ariaLabel={label}
    />
  );
};

/**
 * Module progress variant
 */
export const ModuleProgress: React.FC<Omit<ProgressBarProps, 'colorClass'>> = (
  props
) => {
  return (
    <ProgressBar
      {...props}
      colorClass="bg-teal-600"
      ariaLabel="Module progress"
    />
  );
};

/**
 * Quiz score variant
 */
interface QuizScoreProps extends Omit<ProgressBarProps, 'colorClass'> {
  score: number; // 0-100
  passingScore?: number; // Default 70
}

export const QuizScore: React.FC<QuizScoreProps> = ({
  score,
  passingScore = 70,
  ...props
}) => {
  const passed = score >= passingScore;
  const colorClass = passed ? 'bg-green-600' : 'bg-amber-600';
  const label = passed ? 'Quiz passed' : 'Quiz score';

  return (
    <ProgressBar
      {...props}
      progress={score}
      colorClass={colorClass}
      ariaLabel={label}
    />
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ProgressBar;