import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/errors';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { getHomePathForRole } from '../../routes/paths';
import { AuthCard } from './AuthCard';
import { useLoginMutation } from './hooks';
import { loginSchema, type LoginFormValues } from './schemas';

type LocationState = {
  registered?: boolean;
};

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const login = useLoginMutation();
  const state = location.state as LocationState | null;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);

    try {
      const user = await login.mutateAsync(values);
      navigate(getHomePathForRole(user.role), { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  }

  return (
    <AuthCard
      title="Sign in"
      description="Use your weekly reports account to continue."
      footerText="New team member?"
      footerHref="/register"
      footerLink="Create an account"
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        {state?.registered ? (
          <Alert className="border-green-200 bg-green-50 text-green-900">
            <AlertDescription>
              Registration complete. You can sign in now.
            </AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert className="border-red-200 bg-red-50 text-red-900">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            autoComplete="email"
            type="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register('email')}
          />
          {form.formState.errors.email ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            autoComplete="current-password"
            type="password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register('password')}
          />
          {form.formState.errors.password ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        <Button className="w-full" type="submit" disabled={login.isPending}>
          {login.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
