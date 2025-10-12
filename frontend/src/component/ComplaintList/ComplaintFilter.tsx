import React from 'react';
import type { FilterOption } from '../../hooks/useComplaintData';

interface ComplaintFilterProps {
  filterOption: FilterOption;
  setFilterOption: (option: FilterOption) => void;
}

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: '전체', label: '전체' },
  { value: '답변전', label: '답변 전' },
  { value: '수정중', label: '수정 중' },
  { value: '답변완료', label: '답변 완료' },
];

export default function ComplaintFilter({ filterOption, setFilterOption }: ComplaintFilterProps) {
  return (
    <div className="relative inline-block w-32 mr-4 mt-4 text-gray-700">
      <select
        value={filterOption}
        onChange={(e) => setFilterOption(e.target.value as FilterOption)}
        className="w-full bg-white border border-zinc-400 rounded-lg pl-4 pr-4 py-1 text-base font-medium appearance-none hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300 transition"
      >
        {filterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
