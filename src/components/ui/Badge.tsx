import React from 'react';
import { cn } from '../../lib/utils';
import { CourseStatus } from '../../data/mockData';
interface BadgeProps {
  status?: CourseStatus;
  children?: React.ReactNode;
  className?: string;
}
export function Badge({ status, children, className }: BadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 ring-green-600/20 dark:ring-green-500/20';
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-500/20';
      case 'overdue':
        return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-red-600/20 dark:ring-red-500/20';
      case 'not_started':
        return 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 ring-gray-500/20 dark:ring-gray-400/20';
      default:
        return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 ring-indigo-600/20 dark:ring-indigo-500/20';
    }
  };
  const getStatusLabel = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'overdue':
        return 'Overdue';
      case 'not_started':
        return 'Not Started';
      default:
        return children;
    }
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
        getStatusStyles(),
        className
      )}>
      
      {status ? getStatusLabel() : children}
    </span>);

}