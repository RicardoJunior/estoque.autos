import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, needsOnboarding, signIn } = useAuthStore();
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (user && needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (user && !needsOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      await signIn(data.email, data.password);

      // After signing in, check if onboarding is needed
      const state = useAuthStore.getState();
      if (state.needsOnboarding) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-3xl font-bold text-center justify-center mb-6">
            Estoque.autos
          </h2>
          <p className="text-center text-base-content/60 mb-4">Faça login para acessar o painel</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              fullWidth
              {...register('email')}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              fullWidth
              {...register('password')}
            />

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
              Entrar
            </Button>
          </form>

          <div className="divider">OU</div>

          <Button variant="ghost" fullWidth onClick={() => navigate('/signup')} type="button">
            Criar nova conta
          </Button>
        </div>
      </div>
    </div>
  );
};
