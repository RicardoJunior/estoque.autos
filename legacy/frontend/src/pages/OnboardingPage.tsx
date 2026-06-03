import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

const onboardingSchema = z.object({
  name: z.string().min(2, 'Nome da loja deve ter no mínimo 2 caracteres'),
  slug: z
    .string()
    .min(3, 'URL deve ter no mínimo 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'URL deve conter apenas letras minúsculas, números e hífens')
    .transform((val) => val.toLowerCase()),
  cnpj: z.string().optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  whatsapp: z.string().optional().or(z.literal('')),
  email: z.string().email('E-mail inválido'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, needsOnboarding, createTenant } = useAuthStore();
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  // If user is not authenticated or doesn't need onboarding, redirect
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!needsOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  const slug = watch('slug') || '';
  const storeName = watch('name') || '';

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setError('');
      await createTenant({
        name: data.name,
        slug: data.slug,
        cnpj: data.cnpj || undefined,
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone,
        email: data.email,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar loja');
    }
  };

  const generateSlug = () => {
    const slug = storeName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    return slug;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-center mb-6">
            <h2 className="card-title text-3xl font-bold justify-center mb-2">
              Configure sua Loja
            </h2>
            <p className="text-base-content/60">
              Vamos configurar os dados básicos da sua revenda de veículos
            </p>
          </div>

          <div className="alert alert-info mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">
              Você poderá alterar essas informações depois nas configurações
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações da Loja</h3>

              <Input
                label="Nome da Loja"
                type="text"
                placeholder="Auto Center Silva"
                error={errors.name?.message}
                fullWidth
                {...register('name')}
              />

              <div className="space-y-2">
                <Input
                  label="URL da sua vitrine"
                  type="text"
                  placeholder="auto-center-silva"
                  error={errors.slug?.message}
                  fullWidth
                  {...register('slug')}
                />
                <div className="text-sm text-base-content/60 flex items-center justify-between">
                  <span>
                    Sua loja ficará em:{' '}
                    <strong>app.estoque.autos.com.br/{slug || 'sua-url'}</strong>
                  </span>
                  {storeName && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const form = document.querySelector(
                          'input[name="slug"]'
                        ) as HTMLInputElement;
                        if (form) {
                          form.value = generateSlug();
                          form.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                      }}
                    >
                      Gerar da nome
                    </Button>
                  )}
                </div>
              </div>

              <Input
                label="CNPJ (opcional)"
                type="text"
                placeholder="00.000.000/0000-00"
                error={errors.cnpj?.message}
                fullWidth
                {...register('cnpj')}
              />
            </div>

            <div className="divider"></div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contato</h3>

              <Input
                label="Telefone Principal"
                type="tel"
                placeholder="(11) 3000-0000"
                error={errors.phone?.message}
                fullWidth
                {...register('phone')}
              />

              <Input
                label="WhatsApp (opcional)"
                type="tel"
                placeholder="(11) 99999-9999"
                error={errors.whatsapp?.message}
                fullWidth
                {...register('whatsapp')}
              />

              <Input
                label="E-mail da Loja"
                type="email"
                placeholder="contato@autoCentersilva.com.br"
                error={errors.email?.message}
                fullWidth
                {...register('email')}
              />
            </div>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
              Criar Minha Loja
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
