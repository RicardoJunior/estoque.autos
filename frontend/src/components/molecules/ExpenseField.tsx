import React from 'react';
import { Button } from '../atoms/Button';

export interface Expense {
  description: string;
  amount: number;
}

interface ExpenseFieldProps {
  expenses: Expense[];
  onChange: (expenses: Expense[]) => void;
  error?: string;
}

export const ExpenseField: React.FC<ExpenseFieldProps> = ({ expenses, onChange, error }) => {
  const addExpense = () => {
    onChange([...expenses, { description: '', amount: 0 }]);
  };

  const removeExpense = (index: number) => {
    onChange(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (
    index: number,
    field: 'description' | 'amount',
    value: string | number
  ) => {
    const updated = expenses.map((expense, i) => {
      if (i === index) {
        return { ...expense, [field]: value };
      }
      return expense;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label">
          <span className="label-text font-medium">Despesas Adicionais</span>
        </label>
        <Button
          type="button"
          onClick={addExpense}
          variant="primary"
          outline
          size="sm"
          className="btn-sm"
        >
          + Adicionar Despesa
        </Button>
      </div>

      {expenses.length > 0 && (
        <div className="space-y-2">
          {expenses.map((expense, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Descrição (ex: IPVA, transferência)"
                  value={expense.description}
                  onChange={(e) => updateExpense(index, 'description', e.target.value)}
                  className="input input-bordered input-sm w-full"
                />
              </div>
              <div className="w-32">
                <input
                  type="number"
                  placeholder="Valor"
                  value={expense.amount || ''}
                  onChange={(e) => updateExpense(index, 'amount', parseFloat(e.target.value) || 0)}
                  className="input input-bordered input-sm w-full"
                  min="0"
                  step="0.01"
                />
              </div>
              <button
                type="button"
                onClick={() => removeExpense(index)}
                className="btn btn-ghost btn-sm btn-square text-error"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}

      {expenses.length === 0 && (
        <div className="text-sm text-base-content/60 italic">
          Nenhuma despesa adicional. Clique em "Adicionar Despesa" para incluir custos como IPVA,
          transferência, polimento, etc.
        </div>
      )}
    </div>
  );
};
