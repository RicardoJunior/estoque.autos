import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Buscar por marca, modelo ou placa...',
}) => {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-lg blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-center">
        <svg
          className="absolute left-4 w-5 h-5 text-amber-600/60 group-focus-within:text-amber-500 transition-colors duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-sm border border-neutral-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300 text-neutral-800 placeholder:text-neutral-400 font-light tracking-wide"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        />

        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
            aria-label="Limpar busca"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
