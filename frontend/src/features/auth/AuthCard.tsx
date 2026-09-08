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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
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
