interface HistoryHeaderProps {
  keyword: string;
  setKeyword: (keyword: string) => void;
}

export default function HistoryHeader({ keyword, setKeyword }: HistoryHeaderProps) {
  return (
    <div className="ml-[250px]">
      <div
        data-state="Inactive"
        data-type="Outline"
        className="w-[850px] h-[40px] bg-white rounded outline outline-1 outline-offset-[-1px] outline-zinc-400 inline-flex flex-col justify-start items-start"
      >
        <div className="self-stretch p-2.5 inline-flex justify-start items-start gap-3">
          <div data-style="Outlined" className="w-6 h-6 relative overflow-hidden">
            <div className="w-6 h-6 relative overflow-hidden flex items-center justify-center">
              <img src="/src/assets/Leading_Icon.png" alt="Leading Icon" className="w-4 h-4" />
            </div>
          </div>
          <input
            type="text"
            placeholder="Search"
            className="flex-1 bg-transparent text-stone-500 text-base font-normal font-['Balsamiq_Sans'] leading-normal outline-none"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
