import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchHistoryDetail } from '../utils/api';

interface ComplaintDetail {
  id: number;
  title: string;
  content: string;
  answer: string;
}

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);

  useEffect(() => {
    const loadComplaint = async () => {
      try {
        const res = await fetchHistoryDetail(Number(id));
        setComplaint(res.data);
      } catch (err) {
        console.error('히스토리 상세 불러오기 실패', err);
      }
    };
    loadComplaint();
  }, [id]);

  if (!complaint) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-[1440px] h-[1024px] relative bg-white overflow-hidden">
      {/* 민원 제목 */}
      <div className="w-56 h-8 left-[336px] top-[60px] absolute justify-center text-black text-xl font-semibold font-['Inter'] leading-loose">
        {complaint.title}
      </div>

      {/* 민원 내용 */}
      <div className="w-[997px] h-96 left-[336px] top-[112px] absolute bg-zinc-300 p-4 overflow-y-auto rounded">
        <p className="text-black text-base whitespace-pre-line">{complaint.content}</p>
      </div>

      {/* "저장된 답변" 레이블 */}
      <div className="w-30 h-9 left-[336px] top-[512px] absolute justify-center text-black text-xl font-semibold font-['Inter'] leading-normal">
        저장된 답변
      </div>

      {/* 답변 내용 */}
      <div className="w-[997px] h-72 left-[336px] top-[557px] absolute bg-zinc-300 p-4 overflow-y-auto rounded">
        <p className="text-black text-base whitespace-pre-line">
          {complaint.answer || '답변이 없습니다.'}
        </p>
      </div>

      {/* 목록으로 버튼 */}
      <div
        onClick={() => navigate('/complaints/history')}
        className="cursor-pointer w-44 h-9 px-4 left-[1154px] top-[877px] absolute bg-black rounded-lg inline-flex justify-center items-center gap-2 hover:bg-gray-800 transition"
      >
        <div className="justify-center text-white text-lg font-semibold font-['Inter'] leading-relaxed">
          목록으로
        </div>
      </div>
    </div>
  );
}
