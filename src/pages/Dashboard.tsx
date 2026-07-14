import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserMinus,
  UserX,
  BookOpen,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrgUserStats } from '../hooks/useOrgUserStats';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface OrgStatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}

const OrgStatTile: React.FC<OrgStatTileProps> = ({ icon, label, value, color, bg }) => (
  <div className={`rounded-lg p-3 ${bg}`}>
    <p className={`text-xs font-medium mb-1 flex items-center gap-1.5 ${color}`}>
      {icon}
      {label}
    </p>
    <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const OrgStatsCard: React.FC = () => {
  const { stats, isLoading, error } = useOrgUserStats();

  const total = stats?.total_users || 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Organization
        </h2>
      </div>

      {isLoading && (
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
      )}

      {error && !isLoading && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {stats && !isLoading && !error && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <OrgStatTile
              icon={<Users className="w-3.5 h-3.5" />}
              label="Total"
              value={stats.total_users}
              color="text-indigo-600 dark:text-indigo-400"
              bg="bg-indigo-50 dark:bg-indigo-500/10"
            />
            <OrgStatTile
              icon={<UserCheck className="w-3.5 h-3.5" />}
              label="Active"
              value={stats.active_users}
              color="text-green-600 dark:text-green-400"
              bg="bg-green-50 dark:bg-green-500/10"
            />
            <OrgStatTile
              icon={<UserMinus className="w-3.5 h-3.5" />}
              label="Suspended"
              value={stats.suspended_users}
              color="text-orange-600 dark:text-orange-400"
              bg="bg-orange-50 dark:bg-orange-500/10"
            />
            <OrgStatTile
              icon={<UserX className="w-3.5 h-3.5" />}
              label="Deleted"
              value={stats.deleted_users}
              color="text-red-600 dark:text-red-400"
              bg="bg-red-50 dark:bg-red-500/10"
            />
          </div>

          {total > 0 && (
            <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Membership breakdown
              </p>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700">
                {stats.active_users > 0 && (
                  <div
                    className="bg-green-500"
                    style={{ width: `${pct(stats.active_users)}%` }}
                    title={`Active ${stats.active_users}`}
                  />
                )}
                {stats.suspended_users > 0 && (
                  <div
                    className="bg-orange-400"
                    style={{ width: `${pct(stats.suspended_users)}%` }}
                    title={`Suspended ${stats.suspended_users}`}
                  />
                )}
                {stats.deleted_users > 0 && (
                  <div
                    className="bg-red-500"
                    style={{ width: `${pct(stats.deleted_users)}%` }}
                    title={`Deleted ${stats.deleted_users}`}
                  />
                )}
              </div>
              <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-sm bg-green-500" />
                  Active
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-sm bg-orange-400" />
                  Suspended
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-sm bg-red-500" />
                  Deleted
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-8 text-center">
    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
      {icon}
    </div>
    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{title}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400">{message}</p>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Ready to continue your learning journey?
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Continue Learning
                </h2>
                <Link
                  to="/courses"
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  View all
                </Link>
              </div>
              <EmptyState
                icon={<BookOpen className="w-5 h-5" />}
                title="No courses yet"
                message="Enrolled courses will show up here once course data is connected."
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Assigned to you
              </h2>
              <EmptyState
                icon={<Inbox className="w-5 h-5" />}
                title="Nothing assigned"
                message="Courses assigned by your organization will appear here."
              />
            </motion.div>
          </div>

          <div className="space-y-8">
            <OrgStatsCard />
          </div>
        </div>
      </motion.div>
    </div>
  );
}