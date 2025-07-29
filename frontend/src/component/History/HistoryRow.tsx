import { Link } from 'react-router-dom';

interface HistoryRowProps {
  index: number;
  title: string;
  date: string;
  id: number; // ✅ id를 받아서 링크에 쓸거야
}

export default function HistoryRow({ index, title, date, id }: HistoryRowProps) {
  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

  return (
    <div className="ml-[250px]">
      <div className="w-[850px] h-[40px] relative bg-zinc-300 rounded-lg flex items-center px-4 my-1 hover:bg-zinc-400 transition cursor-pointer">
        <div className="w-8 text-black text-base font-semibold">{index}</div>
        <div className="flex-1 ml-4 text-black text-base">
          <Link
            to={`/complaints/history/${id}`}
            className="hover:underline hover:underline-offset-2"
          >
            {title}
          </Link>
        </div>
        <div className="w-24 text-center text-black text-base">{formattedDate}</div>
      </div>
    </div>
  );
}
