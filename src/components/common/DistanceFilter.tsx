'use client';

import { DISTANCE_OPTIONS } from '@/types';

interface DistanceFilterProps {
  selected: number;
  onChange: (value: number) => void;
}

export default function DistanceFilter({ selected, onChange }: DistanceFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {DISTANCE_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            selected === value
              ? 'bg-orange-500 border-orange-500 text-white'
              : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
