import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    phone: z
      .string()
      .min(10, 'Telefone deve ter no mínimo 10 dígitos')
      .optional()
      .or(z.literal('')),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signUp } = useAuthStore();
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  if (user) {
    return <Navigate to="/onboarding" replace />;
  }

  const onSubmit = async (data: SignupFormData) => {
    try {
      setError('');
      await signUp(data.email, data.password, data.name, data.phone || undefined);
      navigate('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-3xl font-bold text-center justify-center mb-2">
            Criar Conta
          </h2>
          <p className="text-center text-base-content/60 mb-4">
            Comece a gerenciar seu estoque de veículos
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome completo"
              type="text"
              placeholder="João Silva"
              error={errors.name?.message}
              fullWidth
              {...register('name')}
            />

            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              fullWidth
              {...register('email')}
            />

            <Input
              label="Telefone (opcional)"
              type="tel"
              placeholder="(11) 99999-9999"
              error={errors.phone?.message}
              fullWidth
              {...register('phone')}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              fullWidth
              {...register('password')}
            />

            <Input
              label="Confirmar senha"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              fullWidth
              {...register('confirmPassword')}
            />

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
              Criar Conta
            </Button>
          </form>

          <div className="divider">OU</div>

          <Button variant="ghost" fullWidth onClick={() => navigate('/login')} type="button">
            Já tenho uma conta
          </Button>
        </div>
      </div>
    </div>
  );
};
