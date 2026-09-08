import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
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
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-blue-700"
          to="/"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
