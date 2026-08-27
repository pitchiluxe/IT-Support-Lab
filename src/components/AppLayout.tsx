import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Sun, Moon, Monitor, GraduationCap, Settings, TrendingUp, Briefcase, ArrowRight } from 'lucide-react';
import { useTheme } from '@/app/ThemeProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/features/profile/store';
import { useNavigate } from 'react-router-dom';

const appNav = [
  { to: '/dashboard', label: 'Dashboard', icon: Monitor },
  { to: '/labs', label: 'Labs', icon: GraduationCap },
  { to: '/readiness', label: 'Readiness', icon: TrendingUp },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

/** In-page anchor links shown in the header on the landing page. */
const LANDING_NAV = [
  { to: '#how-it-works', label: 'How it works' },
  { to: '#what-it-is', label: 'Features' },
  { to: '#skills', label: 'Skills' },
  { to: '#coach', label: 'AI Coach' },
  { to: '#faq', label: 'FAQ' },
  { to: '#contact', label: 'Contact' },
] as const;

export function AppLayout() {
  const { resolved, toggle } = useTheme();
  const location = useLocation();
  const { hasProfile } = useProfileStore();
  const navigate = useNavigate();

  // Scroll to top whenever the route changes.
  // The main element uses flex-1 overflow-auto, so we reset both the window
  // and that element's scroll position.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const isLanding = location.pathname === '/';
  // The "home" target for the logo. The user wants clicking the logo to
  // always return to the landing page, regardless of where they are.
  const logoTo = '/';

  return (
    <div className="flex h-full flex-col">
      {/* Header — sticky, constrained to max-w so it lines up with the
          centered body. Shows either the landing nav (on `/`) or the app nav
          (everywhere else). Both versions live on the same row. */}
      <header className="sticky top-0 z-40 mx-auto flex h-14 w-full max-w-5xl items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
        {/* Logo — always visible. On `/` it reloads the landing page; on every
            other route it jumps to the dashboard. */}
        <Link
          to={logoTo}
          className="flex items-center gap-2 font-semibold"
          aria-label="IT Support Lab Academy home"
        >
          <GraduationCap className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight">
            IT Support Lab
          </span>
        </Link>

        {/* Divider between logo and nav — only on landing */}
        {isLanding && (
          <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
        )}

        {/* Landing nav: inline anchor links on the landing page. Same
            flex-1 + justify-center pattern as the app nav below so the two
            menus line up identically. */}
        {isLanding ? (
          <nav
            aria-label="Landing page sections"
            className="hidden flex-1 flex-wrap items-center justify-center gap-0 text-xs sm:flex sm:gap-1"
          >
            {LANDING_NAV.map((link) => (
              <a
                key={link.to}
                href={link.to}
                className="whitespace-nowrap rounded-md px-2 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-2.5"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : (
          /* App nav: icon+label buttons on lab pages */
          <nav
            aria-label="Main navigation"
            className="flex flex-1 items-center justify-center gap-1"
          >
            {appNav.map(({ to, label, icon: Icon }) => {
              const active =
                location.pathname === to ||
                location.pathname.startsWith(to + '/');
              return (
                <Link key={to} to={to}>
                  <Button
                    variant={active ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn('gap-1.5', active && 'font-medium')}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side: "Open the app" button (landing) or theme toggle (app pages) */}
        <div className="ml-auto flex items-center gap-2">
          {isLanding ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 whitespace-nowrap"
              onClick={() =>
                navigate(hasProfile ? '/dashboard' : '/settings')
              }
            >
              Open the app
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                resolved === 'dark'
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
              onClick={toggle}
            >
              {resolved === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </header>

      {/* Main */}
      <main ref={mainRef} className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
