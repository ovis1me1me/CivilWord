import { Link } from 'react-router-dom';

interface HistoryRowProps {
  index: number;
  title: string;
  date: string;
  id: number;
  score?: number; // 답변 점수 (optional)
}

export default function HistoryRow({ index, title, date, id, score = 0 }: HistoryRowProps) {
  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

  // ✅ 별점 시각화 함수 (SVG 직접 사용)
  const renderStars = (currentScore: number) => {
    const totalStars = 3;
    return (
      <div className="flex justify-center items-center space-x-1">
        {Array.from({ length: totalStars }, (_, i) => {
          // 점수에 따라 채워진 별 또는 빈 별 스타일을 결정
          const isFilled = i < currentScore;
          return (
            <svg
              key={i}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              // isFilled 값에 따라 className 동적 할당
              className={
                isFilled
                  ? 'w-[18px] h-[18px] fill-yellow-400 stroke-yellow-400' // 채워진 별
                  : 'w-[18px] h-[18px] fill-none stroke-gray-400'      // 빈 별
              }
              strokeWidth="1.5" // 선 굵기 조절 (디자인에 맞게 조절 가능)
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-[40px] bg-zinc-300 rounded-lg flex items-center px-4 my-1 hover:bg-zinc-400 transition cursor-pointer">
      {/* 번호 */}
      <div className="w-16 text-black text-base font-semibold text-center">{index}</div>

      {/* 민원 제목 - 왼쪽 정렬 */}
      <div className="flex-1 text-black text-base text-left px-4">
        <Link to={`/complaints/history/${id}`} className="hover:underline hover:underline-offset-2">
          {title}
        </Link>
      </div>

      {/* 답변 점수 (별점) */}
      <div className="w-32 flex justify-center">{renderStars(score)}</div>

      {/* 날짜 */}
      <div className="w-32 text-center text-black text-base">{formattedDate}</div>
    </div>
  );
}