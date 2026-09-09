import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

type AuthCardProps = {
  title: string;
  description: string;
  footerText: string;
  footerHref: string;
  footerLink: string;
  children: ReactNode;
};

export function AuthCard({
  title,
  description,
  footerText,
  footerHref,
  footerLink,
  children,
}: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-soft">
            WR
          </div>
          <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">
            Weekly Reports
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-normal text-foreground">
            Team Workspace
          </h1>
        </div>
        <Card className="border-slate-200 shadow-soft">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {footerText}{' '}
          <Link className="font-medium text-primary hover:underline" to={footerHref}>
            {footerLink}
          </Link>
        </p>
      </div>
    </main>
  );
}
