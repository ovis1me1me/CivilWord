interface Props {
  sortOption: '기본' | '날짜 오름' | '날짜 내림';
  setSortOption: (option: '기본' | '날짜 오름' | '날짜 내림') => void;
}

export default function SortingDropdown({ sortOption, setSortOption }: Props) {
  return (
    <div className="relative inline-block w-35 mt-4 text-gray-700">
      <select
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value as '기본' | '날짜 오름' | '날짜 내림')}
        className="w-full bg-white border border-zinc-400 rounded-lg pl-4 pr-8 py-1 text-base font-medium appearance-none hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300 transition"
      >
        <option value="기본">기본 목록 순</option>
        <option value="날짜 오름">날짜 오름차순</option>
        <option value="날짜 내림">날짜 내림차순</option>
      </select>
    </div>
  );
}
