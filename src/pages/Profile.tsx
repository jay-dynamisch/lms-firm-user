import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Building, Shield, Settings, Moon, Sun, Monitor, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../components/ThemeProvider';
import { cn } from '../lib/utils';

export default function Profile() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const initials = (user?.name?.trim() || user?.email?.split('@')[0] || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Profile
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: User Info & Settings */}
        <div className="space-y-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden"
          >
            <div className="h-24 bg-indigo-600 dark:bg-indigo-500 relative">
              <div className="absolute -bottom-10 left-6">
                <div className="w-20 h-20 rounded-full ring-4 ring-white dark:ring-slate-800 bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-300">
                  {initials}
                </div>
              </div>
            </div>
            <div className="pt-14 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {user?.name || 'Unnamed user'}
              </h2>
              <p className="text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-4 capitalize">
                {user?.role || 'Member'}
              </p>

              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                {user?.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
                {user?.organizationId && (
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate font-mono text-xs">{user.organizationId}</span>
                  </div>
                )}
                {user?.accountType && (
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="capitalize">{user.accountType}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-900 dark:text-white" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Preferences</h3>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-slate-900 rounded-lg">
                {[
                  { id: 'light', icon: Sun, label: 'Light' },
                  { id: 'dark', icon: Moon, label: 'Dark' },
                  { id: 'system', icon: Monitor, label: 'System' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={cn(
                      'flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-medium transition-all',
                      theme === t.id
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    <t.icon className="w-4 h-4 mb-1" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Achievements (no backend yet) */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Learning history
              </h3>
            </div>
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Award className="w-8 h-8 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              Course progress and completed achievements will show up here once
              enrollment tracking is connected.
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}