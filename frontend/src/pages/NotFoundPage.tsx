import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-soft">
        <p className="text-sm font-semibold uppercase text-muted-foreground">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you requested does not exist in the current frontend shell.
        </p>
        <Link
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-strong"
          to="/"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
