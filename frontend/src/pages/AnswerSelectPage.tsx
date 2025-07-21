import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { updateReplySummary, updateReplyStatus, fetchReplySummary } from '../utils/api';
import Header from '../component/ComplaintDetail/Header';
import LeftPanel from '../component/AnswerSelect/LeftPanel';
import RightPanel from '../component/AnswerSelect/RightPanel';
import SegmentedControl from '../component/AnswerSelect/SegmentedControl';
import AnswerBox from '../component/AnswerSelect/AnswerBox';
import { FullAnswer, createNewBlock } from '../component/AnswerSelect/types'; // createNewBlock도 import
import AnswerSelectActions from '../component/AnswerSelect/AnswerSelectActions';
import Spinner from '../component/Shared/Spinner';

// (헬퍼 함수들은 이전과 동일)
// 1. stringToFullAnswer 함수 로직 수정
const stringToFullAnswer = (text: string): FullAnswer => {
  try {
    const parsed = JSON.parse(text);
    // FullAnswer는 객체이므로, 내부에 contentBlocks 배열이 있는지 확인
    if (parsed && Array.isArray(parsed.contentBlocks)) {
      return parsed as FullAnswer;
    }
  } catch (e) {}
  // 파싱 실패 시, 기본 구조 생성 (고유 ID를 위해 uuid 사용)
  return {
    greeting: '인사말입니다.',
    complaintSummary: '민원요지입니다.',
    contentBlocks: [createNewBlock('민원에 대한 검토 결과입니다.')],
    closing: '끝맺음입니다.'
  };
};

const fullAnswerToString = (content: FullAnswer): string => JSON.stringify(content);

const REPLY_STATUS = {
  EDITING: '수정중',
  COMPLETED: '답변완료',
} as const; 

export default function AnswerSelectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintContent, setComplaintContent] = useState('');
  const [complaintSummary, setComplaintSummary] = useState(''); 
  const [answerSummary, setAnswerSummary] = useState('');
  const [generatedAnswers, setGeneratedAnswers] = useState<FullAnswer[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<'생성된 답변' | '유사 민원 답변'>('생성된 답변');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<FullAnswer | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // (useEffect 및 핸들러 함수들은 이전과 동일)
  useEffect(() => {
    const loadReplyData = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchReplySummary(Number(id));
        setComplaintTitle(res.data.title || '제목 없음');
        setComplaintContent(res.data.content || '내용 없음');
        setComplaintSummary(res.data.complaint_summary || '민원 요약 없음');
        setAnswerSummary(res.data.summary || '');
        
        // 2. 올바른 헬퍼 함수 이름 사용
        const processedAnswers = (res.data.generated_replies || []).map(stringToFullAnswer);
        setGeneratedAnswers(processedAnswers);
        if (res.data.selected_reply) {
          setSelectedAnswer(stringToFullAnswer(res.data.selected_reply));
          setIsEditing(true);
        }
      } catch (err) {
        console.error('답변 데이터 불러오기 실패', err);
        setError('답변 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    loadReplyData();
  }, [id]);

  // 4. 저장 로직에서 새로운 헬퍼 함수 사용
  const saveAnswer = async (status: '수정중' | '답변완료') => {
    const confirmMessage = status === REPLY_STATUS.COMPLETED ? '답변을 완료하시겠습니까?' : '답변을 보류하고 목록으로 이동할까요?';
    if (window.confirm(confirmMessage)) {
      if (!id || !selectedAnswer) return;
      try {
        // 2. 올바른 헬퍼 함수 이름 사용
        const finalAnswerString = fullAnswerToString(selectedAnswer);
        await updateReplySummary(Number(id), finalAnswerString);
        await updateReplyStatus(Number(id), status);
        navigate('/complaints');
      } catch (err) {
        console.error(`답변 ${status} 처리 실패`, err);
        alert(`처리 중 오류가 발생했습니다.`);
      }
    }
  };

  const handleReselect = () => { setSelectedAnswer(null); setIsEditing(false); };
  const handleHold = () => saveAnswer(REPLY_STATUS.EDITING);
  const handleComplete = () => saveAnswer(REPLY_STATUS.COMPLETED);
  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setSelectedAnswer(null);
      setCurrentPage(0);
      setIsEditing(false);
    }, 2000);
  };

  // 로딩 및 에러 처리는 여기서 먼저 수행 (Early Return)
  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;

  // 최종 렌더링 JSX (하나의 return 문으로 통합)
  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto p-8 space-y-8 min-h-screen bg-slate-50">
      <Header complaintId={Number(id)} title={complaintTitle} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <LeftPanel 
          content={complaintContent} 
        />
        <RightPanel
          summary={complaintSummary}
          answerSummary={answerSummary}
          setAnswerSummary={setAnswerSummary}
          onRegenerate={handleRegenerate}
          isGenerating={isGenerating}
        />
      </div>
      <div className="flex justify-start">
        <SegmentedControl selected={selectedSegment} setSelected={setSelectedSegment} />
      </div>

      <div className="flex gap-4 relative min-h-[384px]">
        {selectedSegment === '생성된 답변' && generatedAnswers.length > 0 && (
          // 3. AnswerBox에 isEditing, onEdit prop 추가
          <AnswerBox
            content={selectedAnswer ?? generatedAnswers[currentPage]}
            onChange={setSelectedAnswer}
            isEditing={isEditing}
            onEdit={() => {
              // 원본 데이터를 보호하기 위해 깊은 복사 사용
              setSelectedAnswer(JSON.parse(JSON.stringify(generatedAnswers[currentPage])));
              setIsEditing(true);
            }}
          />
        )}
        {selectedSegment === '생성된 답변' && generatedAnswers.length === 0 && !loading && (
          <div className="flex items-center justify-center w-full p-4 bg-zinc-200 rounded">
            생성된 답변이 없습니다.
          </div>
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

      {selectedAnswer ? (
        <AnswerSelectActions onReselect={handleReselect} onHold={handleHold} onComplete={handleComplete} />
      ) : (
        generatedAnswers.length > 1 && (
          <div className="flex justify-center gap-2">
            {generatedAnswers.map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i)} className={`px-2 py-1 rounded text-xs ${currentPage === i ? 'bg-black text-white' : 'bg-gray-200'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}