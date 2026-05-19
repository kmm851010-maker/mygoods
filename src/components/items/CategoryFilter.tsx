'use client';

import { CATEGORIES } from '@/types';

interface CategoryFilterProps {
  selected: string;
  onChange: (key: string) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div
      className="flex gap-2 pb-2 px-4"
      style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexWrap: 'nowrap' }}
    >
      {CATEGORIES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{ flexShrink: 0 }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
            selected === key
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
