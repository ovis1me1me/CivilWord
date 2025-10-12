import { SortOption } from '../../hooks/useHistoryData'; // ✅ useHistoryData에서 가져오기

interface Props {
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
}

export default function SortingDropdown({ sortOption, setSortOption }: Props) {
  return (
    <div className="relative inline-block w-40 mt-4 text-gray-700">
      <select
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value as SortOption)}
        className="w-full bg-white border border-zinc-400 rounded-lg pl-4 pr-6 py-1 text-base font-medium appearance-none hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300 transition"
      >
        <option value="기본">기본 목록 순</option>
        <option value="날짜 오름">날짜 오름차순</option>
        <option value="날짜 내림">날짜 내림차순</option>
        <option value="평가 높은순">평가 높은순</option>
        <option value="평가 낮은순">평가 낮은순</option>
      </select>
    </div>
  );
}
