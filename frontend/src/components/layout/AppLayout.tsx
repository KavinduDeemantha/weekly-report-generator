import {
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { useCurrentUser, useLogoutMutation } from '../../features/auth/hooks';
import { getHomePathForRole } from '../../routes/paths';

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const memberNav: NavItem[] = [
  { label: 'My Reports', href: '/reports', icon: FileText },
  { label: 'New Report', href: '/reports/new', icon: PlusCircle },
];

const managerNav: NavItem[] = [
  { label: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
  { label: 'Team Reports', href: '/manager/reports', icon: FileText },
  { label: 'Projects', href: '/manager/projects', icon: FolderKanban },
  { label: 'Users', href: '/manager/users', icon: Users },
];

export function AppLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const logout = useLogoutMutation();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const navItems = user.role === 'MANAGER' ? managerNav : memberNav;

  async function handleLogout() {
    await logout.mutateAsync();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800 bg-slate-950 px-4 py-5 text-white shadow-2xl shadow-slate-950/10 transition-transform lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="px-2">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              WR
            </div>
            <p className="text-xs font-semibold uppercase text-slate-400">
              Weekly Reports
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-normal text-white">
              Team Workspace
            </h1>
          </div>

          <nav className="mt-8 space-y-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.label}
                  to={item.href}
                  end={item.href === getHomePathForRole(user.role)}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-900 hover:text-white',
                      isActive &&
                        'bg-primary/15 text-white ring-1 ring-primary/25 before:absolute before:left-0 before:h-5 before:w-1 before:rounded-r-full before:bg-accent',
                    )
                  }
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="mt-1 truncate text-xs text-slate-400">
              {user.email}
            </p>
            <Badge className="mt-3 border-primary/30 bg-primary/15 text-indigo-100">
              {user.role.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </aside>

      {isMobileOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          type="button"
          onClick={() => setIsMobileOpen(false)}
        />
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 shadow-sm backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              aria-label="Open navigation"
              className="lg:hidden"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Signed in as
              </p>
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </Button>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
