import { Link } from 'react-router-dom';

interface HistoryRowProps {
  index: number;
  title: string;
  date: string;
  id: number; // ✅ id를 받아서 링크에 쓸거야
}

export default function HistoryRow({ index, title, date, id }: HistoryRowProps) {
  return (
    <div className="w-[928px] h-11 relative bg-zinc-300 rounded-3xl flex items-center px-4 my-1">
      <div className="w-8 text-black text-base font-medium font-['Inter']">{index}</div>
      <div className="flex-1 ml-4 text-black text-base font-medium font-['Inter']">
        <Link
          to={`/complaints/history/${id}`} // ✅ 여기서 id를 링크에 사용
          className="hover:underline"
        >
          {title}
        </Link>
      </div>
      <div className="w-24 text-center text-black text-base font-medium font-['Inter']">{date}</div>
    </div>
  );
}
