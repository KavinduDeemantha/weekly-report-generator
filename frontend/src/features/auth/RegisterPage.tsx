import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/errors';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { AuthCard } from './AuthCard';
import { useRegisterMutation } from './hooks';
import { registerSchema, type RegisterFormValues } from './schemas';

export function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const register = useRegisterMutation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setError(null);

    try {
      await register.mutateAsync(values);
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  }

  return (
    <AuthCard
      title="Create account"
      description="Public registration creates a team-member account."
      footerText="Already registered?"
      footerHref="/login"
      footerLink="Sign in"
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        {error ? (
          <Alert className="border-red-200 bg-red-50 text-red-900">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register('name')}
          />
          {form.formState.errors.name ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

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
            autoComplete="new-password"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            autoComplete="new-password"
            type="password"
            aria-invalid={Boolean(form.formState.errors.confirmPassword)}
            {...form.register('confirmPassword')}
          />
          {form.formState.errors.confirmPassword ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <Button className="w-full" type="submit" disabled={register.isPending}>
          {register.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          Register
        </Button>
      </form>
    </AuthCard>
  );
}
