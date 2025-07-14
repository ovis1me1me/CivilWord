import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { updateReplySummary, updateReplyStatus, fetchReplySummary } from '../utils/api';
import Header from '../component/ComplaintDetail/Header';
import LeftPanel from '../component/AnswerSelect/LeftPanel';
import RightPanel from '../component/AnswerSelect/RightPanel';
import SegmentedControl from '../component/AnswerSelect/SegmentedControl';
import AnswerBox from '../component/AnswerSelect/AnswerBox';
import AnswerSelectActions from '../component/AnswerSelect/AnswerSelectActions';
import Spinner from '../component/Shared/Spinner';

const dummyGeneratedAnswers = [
  '답변 1: 도로 복구 요청 접수됨.',
  '답변 2: 해당 부서로 전달 예정.',
  '답변 3: 안전 점검 후 조치 예정.',
];
const dummySimilarAnswer = '유사 민원 답변: 최근에 처리된 도로 파손 사례와 유사합니다.';

export default function AnswerSelectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const initialAnswerSummary = location.state?.answerSummary || '';
  const [answerSummary, setAnswerSummary] = useState(initialAnswerSummary);
  const [generatedAnswers, setGeneratedAnswers] = useState<string[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<'생성된 답변' | '유사 민원 답변'>('생성된 답변');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ 페이지 진입 시 기존 답변 데이터 로드
  useEffect(() => {
    const loadReplyData = async () => {
      try {
        const res = await fetchReplySummary(Number(id));
        console.log('불러온 답변 데이터:', res.data);

        setAnswerSummary(res.data.summary || '');
        setGeneratedAnswers(res.data.generated_replies || []);
        setSelectedAnswer(res.data.selected_reply || null);
        setIsEditing(!!res.data.selected_reply);
      } catch (err) {
        console.error('답변 데이터 불러오기 실패', err);
      }
    };
    loadReplyData();
  }, [id]);

  const handleReselect = () => {
    setSelectedAnswer(null);
    setIsEditing(false);
  };

  const handleHold = async () => {
    if (window.confirm('답변을 보류하고 목록으로 이동할까요?')) {
      try {
        const res1 = await updateReplySummary(Number(id), answerSummary);
        console.log('reply-summary 저장결과:', res1.data);

        const res2 = await updateReplyStatus(Number(id), '수정중');
        console.log('reply-status 저장결과:', res2.data);

        navigate('/complaints');
      } catch (err) {
        console.error('답변 보류 실패', err);
      }
    }
  };
  

  const handleComplete = async () => {
    if (window.confirm('답변을 완료하시겠습니까?')) {
      try {
        await updateReplySummary(Number(id), answerSummary);
        await updateReplyStatus(Number(id), '답변완료');
        navigate('/complaints');
      } catch (err) {
        console.error('답변 완료 실패', err);
      }
    }
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setSelectedAnswer(null);
      setCurrentPage(0);
      setIsEditing(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto p-4 gap-4">
      <Header complaintId={Number(id)} title="도로 파손 관련 민원" />

      <div className="flex gap-4">
        <LeftPanel content="도로가 파손되어 차량 통행에 지장이 있어 민원을 제기합니다." />
        <RightPanel
          summary="도로 파손으로 인한 차량 통행 불편"
          answerSummary={answerSummary}
          setAnswerSummary={setAnswerSummary}
          onRegenerate={handleRegenerate}
          isGenerating={isGenerating}
        />
      </div>

      <div className="flex justify-start">
        <SegmentedControl selected={selectedSegment} setSelected={setSelectedSegment} />
      </div>

      <div className="flex gap-4 relative">
        {selectedSegment === '생성된 답변' && generatedAnswers.length > 0 && (
          <AnswerBox
            content={selectedAnswer ?? generatedAnswers[currentPage]}
            isSelected={!!selectedAnswer}
            isEditing={isEditing}
            onEdit={() => {
              setSelectedAnswer(generatedAnswers[currentPage]);
              setIsEditing(true);
            }}
            onChange={(v) => setSelectedAnswer(v)}
          />
        )}
        {selectedSegment === '유사 민원 답변' && (
          <div className="flex-1 h-80 p-4 bg-zinc-300 rounded">유사 답변 예시...</div>
        )}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 rounded">
            <Spinner />
          </div>
        )}
      </div>

      {selectedSegment === '생성된 답변' && !selectedAnswer && (
        <div className="flex justify-center gap-2">
          {dummyGeneratedAnswers.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`px-2 py-1 rounded text-xs ${
                currentPage === i ? 'bg-black text-white' : 'bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {selectedAnswer && (
        <AnswerSelectActions
          onReselect={handleReselect}
          onHold={handleHold}
          onComplete={handleComplete}
        />
      )}

      {selectedAnswer === null && generatedAnswers.length > 1 && (
        <div className="flex justify-center gap-2">
          {generatedAnswers.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`px-2 py-1 rounded text-xs ${
                currentPage === i ? 'bg-black text-white' : 'bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
