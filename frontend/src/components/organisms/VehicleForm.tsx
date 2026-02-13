import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { Textarea } from '../atoms/Textarea';
import { Checkbox } from '../atoms/Checkbox';
import { Button } from '../atoms/Button';
import { StepIndicator } from '../molecules/StepIndicator';
import { ExpenseField, type Expense } from '../molecules/ExpenseField';

// Validation schema
const vehicleSchema = z.object({
  // Basic Information
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  version: z.string().optional(),
  year_fab: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  year_model: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 2),
  plate: z.string().optional(),
  color: z.string().min(1, 'Cor é obrigatória'),
  category: z.enum(['car', 'motorcycle', 'utility', 'truck']),

  // Technical Details
  fuel: z.enum(['gasoline', 'ethanol', 'flex', 'diesel', 'electric', 'hybrid']),
  transmission: z.enum(['manual', 'automatic', 'cvt', 'automated']),
  mileage: z.number().min(0, 'Quilometragem inválida'),
  doors: z.number().min(1).max(6).optional(),
  power: z.string().optional(),
  description: z.string().optional(),
  optionals: z.array(z.string()).optional(),

  // Financial Data
  purchase_price: z.number().min(0).optional(),
  expenses: z
    .array(
      z.object({
        description: z.string(),
        amount: z.number().min(0),
      })
    )
    .optional(),
  sale_price: z.number().min(0, 'Preço de venda é obrigatório'),
  max_discount: z.number().min(0).optional(),

  // Marketplace Publishing
  marketplaces: z.array(z.enum(['webmotors', 'olx', 'icarros', 'mercado_livre'])).optional(),
  featured: z.boolean().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  onSubmit: (data: VehicleFormData) => Promise<void>;
  initialData?: Partial<VehicleFormData>;
  isLoading?: boolean;
}

const STEPS = [
  { id: 1, label: 'Informações Básicas', description: 'Marca, modelo e ano' },
  { id: 2, label: 'Detalhes Técnicos', description: 'Motor e opcionais' },
  { id: 3, label: 'Dados Financeiros', description: 'Preços e margem' },
  { id: 4, label: 'Publicação', description: 'Marketplaces e divulgação' },
];

const OPTIONALS = [
  'Ar-condicionado',
  'Direção elétrica',
  'Vidros elétricos',
  'Trava elétrica',
  'Airbag',
  'ABS',
  'Freios ABS',
  'Multimídia',
  'Câmera de ré',
  'Sensor de estacionamento',
  'Piloto automático',
  'Teto solar',
  'Bancos de couro',
  'Rodas de liga leve',
  'Faróis de LED',
  'Computador de bordo',
];

export const VehicleForm: React.FC<VehicleFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [expenses, setExpenses] = useState<Expense[]>(initialData?.expenses || []);
  const [selectedOptionals, setSelectedOptionals] = useState<string[]>(
    initialData?.optionals || []
  );
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setValue,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      category: 'car',
      fuel: 'flex',
      transmission: 'manual',
      mileage: 0,
      doors: 4,
      sale_price: 0,
      year_fab: new Date().getFullYear(),
      year_model: new Date().getFullYear(),
      ...initialData,
    },
  });

  // Watch financial fields for margin calculation
  const purchasePrice = watch('purchase_price') || 0;
  const salePrice = watch('sale_price') || 0;

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Calculate margin
  const grossMargin = salePrice - purchasePrice - totalExpenses;
  const marginPercentage = purchasePrice > 0 ? (grossMargin / purchasePrice) * 100 : 0;

  // Update expenses in form data
  useEffect(() => {
    setValue('expenses', expenses);
  }, [expenses, setValue]);

  // Update optionals in form data
  useEffect(() => {
    setValue('optionals', selectedOptionals);
  }, [selectedOptionals, setValue]);

  // Update marketplaces in form data
  useEffect(() => {
    setValue('marketplaces', selectedMarketplaces as any);
  }, [selectedMarketplaces, setValue]);

  // Update featured in form data
  useEffect(() => {
    setValue('featured', isFeatured);
  }, [isFeatured, setValue]);

  const handleOptionalToggle = (optional: string) => {
    setSelectedOptionals((prev) =>
      prev.includes(optional) ? prev.filter((o) => o !== optional) : [...prev, optional]
    );
  };

  const handleMarketplaceToggle = (marketplace: string) => {
    setSelectedMarketplaces((prev) =>
      prev.includes(marketplace) ? prev.filter((m) => m !== marketplace) : [...prev, marketplace]
    );
  };

  const onFormSubmit = async (data: VehicleFormData) => {
    await onSubmit({
      ...data,
      expenses,
      optionals: selectedOptionals,
      marketplaces: selectedMarketplaces as any,
      featured: isFeatured,
    });
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="vehicle-form-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap');

        .vehicle-form-container {
          font-family: 'Outfit', system-ui, sans-serif;
          --accent-gold: #D4AF37;
          --accent-silver: #C0C0C0;
          --dark-charcoal: #1a1a1a;
          --light-pearl: #f8f8f8;
        }

        .vehicle-form-title {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-size: 2.5rem;
          background: linear-gradient(135deg, var(--dark-charcoal) 0%, #4a4a4a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }

        .vehicle-form-subtitle {
          font-family: 'Outfit', sans-serif;
          font-weight: 300;
          font-size: 1rem;
          color: #666;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .form-section-title {
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          font-size: 1.5rem;
          color: var(--dark-charcoal);
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid var(--accent-gold);
          position: relative;
        }

        .form-section-title::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 60px;
          height: 2px;
          background: var(--dark-charcoal);
        }

        .margin-display {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 2px solid var(--accent-gold);
          border-radius: 12px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .margin-display::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--accent-gold) 0%, var(--accent-silver) 100%);
        }

        .margin-value {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-size: 2rem;
          color: var(--dark-charcoal);
        }

        .margin-percentage {
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          font-size: 1rem;
          opacity: 0.7;
        }

        .margin-positive {
          color: #10b981;
        }

        .margin-negative {
          color: #ef4444;
        }

        .optionals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.5rem;
        }

        .optional-checkbox {
          transition: all 0.2s ease;
        }

        .optional-checkbox:hover {
          transform: translateX(4px);
        }

        .step-navigation {
          display: flex;
          gap: 1rem;
          justify-content: space-between;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .vehicle-form-title {
            font-size: 1.875rem;
          }

          .optionals-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .form-step {
          animation: fadeInUp 0.5s ease-out;
        }

        .input:focus, .select:focus, .textarea:focus {
          border-color: var(--accent-gold);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="vehicle-form-title">{initialData ? 'Editar Veículo' : 'Novo Veículo'}</h1>
          <p className="vehicle-form-subtitle">Configure todos os detalhes</p>
        </div>

        <StepIndicator steps={STEPS} currentStep={currentStep} />

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="form-step">
              <h2 className="form-section-title">Informações Básicas</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Categoria"
                      error={errors.category?.message}
                      fullWidth
                      options={[
                        { value: 'car', label: 'Carro' },
                        { value: 'motorcycle', label: 'Moto' },
                        { value: 'utility', label: 'Utilitário' },
                        { value: 'truck', label: 'Caminhão' },
                      ]}
                    />
                  )}
                />

                <Input
                  {...register('brand')}
                  label="Marca"
                  error={errors.brand?.message}
                  fullWidth
                  placeholder="Ex: Toyota, Honda, Chevrolet"
                />

                <Input
                  {...register('model')}
                  label="Modelo"
                  error={errors.model?.message}
                  fullWidth
                  placeholder="Ex: Corolla, Civic, Onix"
                />

                <Input
                  {...register('version')}
                  label="Versão/Trim (opcional)"
                  error={errors.version?.message}
                  fullWidth
                  placeholder="Ex: XEi 2.0, EXL, Plus"
                />

                <Input
                  {...register('year_fab', { valueAsNumber: true })}
                  type="number"
                  label="Ano de Fabricação"
                  error={errors.year_fab?.message}
                  fullWidth
                  min={1900}
                  max={new Date().getFullYear() + 1}
                />

                <Input
                  {...register('year_model', { valueAsNumber: true })}
                  type="number"
                  label="Ano do Modelo"
                  error={errors.year_model?.message}
                  fullWidth
                  min={1900}
                  max={new Date().getFullYear() + 2}
                />

                <Input
                  {...register('plate')}
                  label="Placa (opcional)"
                  error={errors.plate?.message}
                  fullWidth
                  placeholder="ABC-1234"
                  className="uppercase"
                />

                <Input
                  {...register('color')}
                  label="Cor"
                  error={errors.color?.message}
                  fullWidth
                  placeholder="Ex: Branco, Preto, Prata"
                />
              </div>
            </div>
          )}

          {/* Step 2: Technical Details */}
          {currentStep === 2 && (
            <div className="form-step">
              <h2 className="form-section-title">Detalhes Técnicos</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Controller
                  name="fuel"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Combustível"
                      error={errors.fuel?.message}
                      fullWidth
                      options={[
                        { value: 'gasoline', label: 'Gasolina' },
                        { value: 'ethanol', label: 'Etanol' },
                        { value: 'flex', label: 'Flex' },
                        { value: 'diesel', label: 'Diesel' },
                        { value: 'electric', label: 'Elétrico' },
                        { value: 'hybrid', label: 'Híbrido' },
                      ]}
                    />
                  )}
                />

                <Controller
                  name="transmission"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Câmbio"
                      error={errors.transmission?.message}
                      fullWidth
                      options={[
                        { value: 'manual', label: 'Manual' },
                        { value: 'automatic', label: 'Automático' },
                        { value: 'cvt', label: 'CVT' },
                        { value: 'automated', label: 'Automatizado' },
                      ]}
                    />
                  )}
                />

                <Input
                  {...register('mileage', { valueAsNumber: true })}
                  type="number"
                  label="Quilometragem"
                  error={errors.mileage?.message}
                  fullWidth
                  min={0}
                  placeholder="Ex: 50000"
                />

                <Input
                  {...register('doors', { valueAsNumber: true })}
                  type="number"
                  label="Portas (opcional)"
                  error={errors.doors?.message}
                  fullWidth
                  min={1}
                  max={6}
                />

                <Input
                  {...register('power')}
                  label="Potência (opcional)"
                  error={errors.power?.message}
                  fullWidth
                  placeholder="Ex: 150cv, 1.8"
                />
              </div>

              <div className="mb-8">
                <Textarea
                  {...register('description')}
                  label="Descrição"
                  error={errors.description?.message}
                  fullWidth
                  rows={4}
                  placeholder="Descreva o veículo, seu estado de conservação, histórico, diferenciais..."
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium text-lg">Opcionais e Acessórios</span>
                </label>
                <div className="optionals-grid mt-4">
                  {OPTIONALS.map((optional) => (
                    <div key={optional} className="optional-checkbox">
                      <Checkbox
                        label={optional}
                        checked={selectedOptionals.includes(optional)}
                        onChange={() => handleOptionalToggle(optional)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Financial Data */}
          {currentStep === 3 && (
            <div className="form-step">
              <h2 className="form-section-title">Dados Financeiros</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Input
                  {...register('purchase_price', { valueAsNumber: true })}
                  type="number"
                  label="Preço de Compra (opcional)"
                  error={errors.purchase_price?.message}
                  fullWidth
                  min={0}
                  step={0.01}
                  placeholder="R$ 0,00"
                  helperText="Valor pago na aquisição do veículo"
                />

                <Input
                  {...register('sale_price', { valueAsNumber: true })}
                  type="number"
                  label="Preço de Venda"
                  error={errors.sale_price?.message}
                  fullWidth
                  min={0}
                  step={0.01}
                  placeholder="R$ 0,00"
                  helperText="Valor anunciado para venda"
                />

                <Input
                  {...register('max_discount', { valueAsNumber: true })}
                  type="number"
                  label="Desconto Máximo Autorizado (opcional)"
                  error={errors.max_discount?.message}
                  fullWidth
                  min={0}
                  step={0.01}
                  placeholder="R$ 0,00"
                  helperText="Desconto que vendedores podem oferecer"
                />
              </div>

              <div className="mb-8">
                <ExpenseField
                  expenses={expenses}
                  onChange={setExpenses}
                  error={errors.expenses?.message}
                />
              </div>

              {/* Margin Display */}
              <div className="margin-display">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                      Margem Bruta
                    </div>
                    <div
                      className={`margin-value ${grossMargin >= 0 ? 'margin-positive' : 'margin-negative'}`}
                    >
                      R${' '}
                      {grossMargin.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div
                      className={`margin-percentage ${grossMargin >= 0 ? 'margin-positive' : 'margin-negative'}`}
                    >
                      {marginPercentage.toFixed(2)}% sobre o custo
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Custo Total</div>
                    <div className="text-xl font-semibold">
                      R${' '}
                      {(purchasePrice + totalExpenses).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm border-t pt-4">
                  <div>
                    <div className="text-gray-600">Compra</div>
                    <div className="font-semibold">
                      R$ {purchasePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Despesas</div>
                    <div className="font-semibold">
                      R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Venda</div>
                    <div className="font-semibold">
                      R$ {salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Marketplace Publishing */}
          {currentStep === 4 && (
            <div className="form-step">
              <h2 className="form-section-title">Publicação e Divulgação</h2>

              <div className="mb-8">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Selecione em quais marketplaces deseja publicar este veículo. Certifique-se
                        de ter configurado as credenciais de cada marketplace antes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="flex items-center space-x-3 p-4 border-2 border-amber-300 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-warning"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                    />
                    <div>
                      <div className="font-semibold text-amber-900 flex items-center">
                        <span className="text-xl mr-2">⭐</span>
                        Veículo em Destaque
                      </div>
                      <div className="text-sm text-amber-700">
                        Exibir este veículo na seção de destaques da landing page
                      </div>
                    </div>
                  </label>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Marketplaces Integrados
                  </h3>

                  <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={selectedMarketplaces.includes('webmotors')}
                      onChange={() => handleMarketplaceToggle('webmotors')}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Webmotors</div>
                      <div className="text-sm text-gray-600">
                        Maior portal de veículos do Brasil
                      </div>
                    </div>
                    <span className="badge badge-primary">Recomendado</span>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={selectedMarketplaces.includes('olx')}
                      onChange={() => handleMarketplaceToggle('olx')}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">OLX / ZAP Imóveis</div>
                      <div className="text-sm text-gray-600">
                        Plataforma de classificados com grande alcance
                      </div>
                    </div>
                    <span className="badge badge-primary">Recomendado</span>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={selectedMarketplaces.includes('icarros')}
                      onChange={() => handleMarketplaceToggle('icarros')}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">iCarros</div>
                      <div className="text-sm text-gray-600">Portal especializado em veículos</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={selectedMarketplaces.includes('mercado_livre')}
                      onChange={() => handleMarketplaceToggle('mercado_livre')}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Mercado Livre</div>
                      <div className="text-sm text-gray-600">
                        Maior marketplace da América Latina
                      </div>
                    </div>
                  </label>
                </div>

                {selectedMarketplaces.length > 0 && (
                  <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">
                          <span className="font-semibold">{selectedMarketplaces.length}</span>{' '}
                          marketplace(s) selecionado(s). O veículo será publicado automaticamente
                          após o salvamento.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="step-navigation">
            <div>
              {currentStep > 1 && (
                <Button type="button" onClick={prevStep} variant="primary" outline>
                  ← Voltar
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              {currentStep < STEPS.length ? (
                <Button type="button" onClick={nextStep} variant="primary">
                  Próximo →
                </Button>
              ) : (
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                      Salvando...
                    </>
                  ) : (
                    'Salvar Veículo'
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
