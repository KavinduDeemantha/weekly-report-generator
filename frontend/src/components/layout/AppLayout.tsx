import { LogOut, Menu, PlusCircle, Users, FolderKanban, LayoutDashboard, FileText } from 'lucide-react';
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
  { label: 'Team Reports', href: '/manager/dashboard', icon: FileText },
  { label: 'Projects', href: '/manager/dashboard', icon: FolderKanban },
  { label: 'Users', href: '/manager/dashboard', icon: Users },
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
    <div className="min-h-screen bg-slate-50">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-background px-4 py-5 transition-transform lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="px-2">
            <p className="text-sm font-semibold uppercase text-muted-foreground">
              Weekly Reports
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-normal">
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
                      'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                      isActive && 'bg-muted text-foreground',
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

          <div className="mt-auto rounded-lg border border-border bg-slate-50 p-4">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {user.email}
            </p>
            <Badge className="mt-3">{user.role.replace('_', ' ')}</Badge>
          </div>
        </div>
      </aside>

      {isMobileOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          type="button"
          onClick={() => setIsMobileOpen(false)}
        />
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
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
              <p className="text-sm font-medium text-muted-foreground">
                Signed in as
              </p>
              <p className="text-sm font-semibold">{user.name}</p>
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

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
