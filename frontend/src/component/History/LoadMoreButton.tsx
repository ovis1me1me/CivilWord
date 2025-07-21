interface LoadMoreButtonProps {
  onClick: () => void;
}

export default function LoadMoreButton({ onClick }: LoadMoreButtonProps) {
  return (
    <div
      onClick={onClick}
      className="w-80 px-4 py-3 rounded-[90px] outline outline-1 outline-offset-[-1px] outline-slate-500 inline-flex justify-center items-center gap-3 cursor-pointer hover:bg-slate-100 transition"
    >
      <div className="w-1/6 text-center text-slate-500 text-sm font-bold font-['DM_Sans'] leading-none"> {/*7/20 w-1/6 추가*/}
        Load more 10+
      </div>
    </div>
  );
}
