export interface HistoryHeaderProps {
  keyword: string;
  setKeyword: (keyword: string) => void;
}

export default function HistoryHeader({ keyword, setKeyword }: HistoryHeaderProps) {
  // 내부 오프셋(ml/absolute 등) 제거. 폭/정렬은 부모(ContentCenter)가 담당.
  return (
    <div className="w-full">
      <div
        data-state="Inactive"
        data-type="Outline"
        className="w-full h-10 bg-white rounded outline outline-offset-[-1px] outline-zinc-400 flex items-center"
      >
        {/* Leading Icon */}
        <div className="pl-3 pr-2 flex items-center justify-center">
          {/* 프로젝트 자산 경로 유지 (필요 시 아이콘 컴포넌트로 대체 가능) */}
          <img
            src="/src/assets/Leading_Icon.png"
            alt="Search"
            className="w-4 h-4"
          />
        </div>

        {/* Input */}
        <input
          type="text"
          placeholder="Search"
          className="flex-1 bg-transparent text-stone-600 text-base leading-normal outline-none border-none placeholder:text-stone-400"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
    </div>
  );
}