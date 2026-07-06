import React, { useMemo, useCallback, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Award,
  User,
  Bell,
  Search,
  Menu,
  X,
  GraduationCap,
  Sun,
  Moon,                   
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';   
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../context/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface NavItem {
  icon: React.ReactNode;
  label: string;        
  path: string; 
}

// ============================================================================
// NAV CONFIGURATION
// ============================================================================

const navItems: NavItem[] = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/' },
  { icon: <BookOpen className="w-5 h-5" />, label: 'Courses', path: '/courses' },
  { icon: <ClipboardList className="w-5 h-5" />, label: 'Quizzes', path: '/quizzes' },
  { icon: <Award className="w-5 h-5" />, label: 'Certificates', path: '/certificates' },
  { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
];

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useIsLessonPlayer = (): boolean => {
  const location = useLocation();
  return useMemo(() => location.pathname.includes('/lessons/'), [location.pathname]);
};

const useLogout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);
};

const useUserInitials = (name?: string, email?: string): string => {
  return useMemo(() => {
    const source = name?.trim() || email?.split('@')[0] || '?';
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return source.slice(0, 2).toUpperCase();
  }, [name, email]);
};

/**
 * Colored role badge — role is a semantic distinction worth signaling
 * at a glance, not just plain text.
 */
const useRoleBadgeClass = (role?: string): string => {
  return useMemo(() => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400';
      case 'org_admin':
        return 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400';
      default:
        return 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400';
    }
  }, [role]);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ThemeToggleProps {
  theme: string;
  onToggle: () => void;
  compact?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle, compact = false }) => {
  const buttonClass = compact
    ? 'p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
    : 'p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700';

  return (
    <button
      onClick={onToggle}
      className={cn(buttonClass, 'rounded-md transition-colors')}
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

interface BrandProps {
  size?: 'sm' | 'md';
  collapsed?: boolean;
}

const Brand: React.FC<BrandProps> = ({ size = 'md', collapsed = false }) => {
  const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';
  const textSize = size === 'sm' ? 'text-base' : 'text-xl';

  return (
    <div className={cn('flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold', textSize)}>
      <GraduationCap className={cn(iconSize, 'shrink-0')} aria-hidden="true" />
      {!collapsed && <span className="truncate">Dyna Learning</span>}
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}

const NavItemComponent: React.FC<NavItemProps> = ({ icon, label, path, onNavigate, collapsed = false }) => {
  return (
    <NavLink
      to={path}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative group',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          {React.cloneElement(icon as React.ReactElement, {
            className: cn(
              'w-5 h-5 shrink-0',
              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
            ),
          })}
          {!collapsed && <span>{label}</span>}
          {isActive && !collapsed && (
            <motion.div
              layoutId="activeNav"
              className="absolute left-0 w-1 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-r-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              aria-hidden="true"
            />
          )}
        </>
      )}
    </NavLink>
  );
};

interface LogoutButtonProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onNavigate, collapsed = false }) => {
  const handleLogout = useLogout();
  const handleClick = useCallback(() => {
    onNavigate?.();
    handleLogout();
  }, [onNavigate, handleLogout]);

  return (
    <button
      onClick={handleClick}
      title={collapsed ? 'Log out' : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full',
        collapsed && 'justify-center px-0',
        'text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400'
      )}
    >
      <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span>Log out</span>}
    </button>
  );
};

const SearchBar: React.FC = () => {
  const [searchValue, setSearchValue] = React.useState('');
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    // TODO: Implement actual search functionality
  }, []);

  return (
    <div className="flex-1 max-w-xl">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search courses, skills, or topics..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className={cn(
            'w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900',
            'border border-gray-200 dark:border-slate-700 rounded-lg text-sm',
            'text-gray-900 dark:text-white',
            'placeholder-gray-500 dark:placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
            'dark:focus:border-indigo-500 transition-all'
          )}
          aria-label="Search courses, skills, or topics"
        />
      </div>
    </div>
  );
};

interface TopbarProps {
  theme: string;
  onThemeToggle: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ theme, onThemeToggle }) => {
  return (
    <header className="hidden md:flex h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 items-center justify-between px-8 sticky top-0 z-20 transition-colors duration-200">
      <SearchBar />
      <div className="flex items-center gap-4 ml-4">
        <ThemeToggle theme={theme} onToggle={onThemeToggle} compact />
        <button
          className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};

interface MobileHeaderProps {
  theme: string;
  onThemeToggle: () => void;
  onMenuToggle: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ theme, onThemeToggle, onMenuToggle }) => {
  return (
    <div className="md:hidden bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      <Brand size="sm" />
      <div className="flex items-center gap-2">
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        <button
          onClick={onMenuToggle}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          aria-label="Open navigation menu"
          aria-expanded="false"
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

/**
 * Desktop sidebar — collapsible to an icon-only rail, real user profile
 * with a colored role badge, and a "Menu" section label.
 */
interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapsed }) => {
  const { user } = useAuth();
  const initials = useUserInitials(user?.name, user?.email);
  const roleBadgeClass = useRoleBadgeClass(user?.role);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 sticky top-0 h-screen transition-all duration-200',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div
        className={cn(
          'p-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700',
          collapsed && 'justify-center px-3'
        )}
      >
        <Brand collapsed={collapsed} />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Menu
          </p>
        )}
        {navItems.map((item) => (
          <NavItemComponent
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-slate-700 space-y-1">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2',
            collapsed && 'justify-center px-0'
          )}
        >
          <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 ring-2 ring-gray-100 dark:ring-slate-700 shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || user?.email || 'Signed in'}
              </span>
              {user?.role && (
                <span
                  className={cn(
                    'inline-block w-fit mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize',
                    roleBadgeClass
                  )}
                >
                  {user.role.replace('_', ' ')}
                </span>
              )}
            </div>
          )}
        </div>

        <LogoutButton collapsed={collapsed} />

        <button
          onClick={onToggleCollapsed}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full mt-1',
            collapsed && 'justify-center px-0',
            'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-700 dark:hover:text-gray-300'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronsRight className="w-5 h-5 shrink-0" aria-hidden="true" />
          ) : (
            <>
              <ChevronsLeft className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const initials = useUserInitials(user?.name, user?.email);
  const roleBadgeClass = useRoleBadgeClass(user?.role);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/50 z-40 md:hidden"
            aria-hidden="true"
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 z-50 md:hidden flex flex-col"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
              <Brand size="sm" />
              <button
                onClick={onClose}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || user?.email || 'Signed in'}
                </p>
                {user?.role && (
                  <span
                    className={cn(
                      'inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize',
                      roleBadgeClass
                    )}
                  >
                    {user.role.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              <p className="px-3 pb-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Menu
              </p>
              {navItems.map((item) => (
                <NavItemComponent
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  onNavigate={onClose}
                />
              ))}
            </nav>

            <div className="p-4 border-t border-gray-100 dark:border-slate-700">
              <LogoutButton onNavigate={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const isLessonPlayer = useIsLessonPlayer();

  const handleThemeToggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  if (isLessonPlayer) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col md:flex-row transition-colors duration-200">
      <MobileHeader theme={theme} onThemeToggle={handleThemeToggle} onMenuToggle={handleMobileMenuToggle} />
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={handleMobileMenuClose} />
      <Sidebar collapsed={isSidebarCollapsed} onToggleCollapsed={handleSidebarToggle} />

      <main className="flex-1 flex flex-col min-w-0">
        <Topbar theme={theme} onThemeToggle={handleThemeToggle} />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}