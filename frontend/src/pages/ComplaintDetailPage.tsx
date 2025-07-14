import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../component/ComplaintDetail/Header';
import ContentBox from '../component/ComplaintDetail/ContentBox';
import AnswerTextarea from '../component/ComplaintDetail/AnswerTextArea';
import Spinner from '../component/Shared/Spinner'; // 🔥 추가
import { ComplaintDetail } from '../types/complaint';

const dummyComplaint: ComplaintDetail = {
  id: 1,
  title: '도로 파손 관련 민원',
  content: '도로가 파손되어 차량 통행에 지장이 있어 민원을 제기합니다.',
  summary: '도로 파손으로 인해 차량 통행 불편이 발생했습니다.',
  answerSummary: '',
};

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [complaint] = useState<ComplaintDetail>(dummyComplaint);
  const [answerSummary, setAnswerSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAnswer = () => {
    setIsGenerating(true);
    setTimeout(() => {
      navigate(`/complaints/${id}/select-answer`, { state: { answerSummary } });
    }, 2000);
  };

  return (
    <div className="p-4 max-w-[1000px] mx-auto relative space-y-6">
      <Header complaintId={complaint.id} title={complaint.title} />

      <ContentBox label="1) 민원 내용" content={complaint.content} />
      <ContentBox label="2) 민원 요지" content={complaint.summary} />

      <AnswerTextarea
        answerSummary={answerSummary}
        setAnswerSummary={setAnswerSummary}
      />

      <div className="flex justify-end">
        <button
          onClick={handleGenerateAnswer}
          disabled={isGenerating}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold ${
            isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800 transition'
          }`}
        >
          {isGenerating ? '답변 생성 중' : '답변 생성'}
          {isGenerating && <Spinner />} {/* 🔥 버튼 내부에 스피너 표시 */}
        </button>
      </div>
    </div>
  );
}
