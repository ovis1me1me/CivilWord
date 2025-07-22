import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { fetchComplaintSummary, updateReplySummary, updateReplyStatus, fetchReplies, fetchReplySummary, regenerateReply, saveReplySummary } from '../utils/api';
import Header from '../component/ComplaintDetail/Header';
import LeftPanel from '../component/AnswerSelect/LeftPanel';
import RightPanel from '../component/AnswerSelect/RightPanel';
import SegmentedControl from '../component/AnswerSelect/SegmentedControl';
import AnswerBox from '../component/AnswerSelect/AnswerBox';
import { FullAnswer, createNewBlock } from '../component/AnswerSelect/types'; // createNewBlock도 import
import AnswerSelectActions from '../component/AnswerSelect/AnswerSelectActions';
import Spinner from '../component/Shared/Spinner';

interface AnswerSection {
  title: string;
  text: string;
}

interface AnswerSummaryBlock {
  review: string;
  sections: AnswerSection[];
}

// (헬퍼 함수들은 이전과 동일)
// 백엔드 데이터 구조에 맞는 새로운 헬퍼 함수
const convertBackendReplyToFullAnswer = (backendReply: any, complaintSummaryText: string): FullAnswer => {
  const content = backendReply?.content;

  // 백엔드 데이터의 content가 객체가 아니거나 없는 경우, 기본 오류 구조를 반환합니다.
  if (typeof content !== 'object' || content === null) {
    return {
      greeting: '오류',
      complaintSummary: '오류',
      contentBlocks: [createNewBlock('답변 형식이 올바르지 않습니다.')],
      closing: '오류'
    };
  }

  // 백엔드의 header, body, footer를 FullAnswer 구조에 맞게 매핑합니다.
  const greeting = content.header || '인사말이 없습니다.';
  const body = content.body || '본문 내용이 없습니다.';
  const closing = content.footer || '끝맺음말이 없습니다.';

  return {
    greeting: greeting,
    complaintSummary: complaintSummaryText, // 실제 민원 요지는 다른 API에서 오므로, 여기서는 기본값을 사용합니다.
    contentBlocks: [createNewBlock(body)], // body 전체를 하나의 contentBlock으로 만듭니다.
    closing: closing
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
  const [answerSummaryBlocks, setAnswerSummaryBlocks] = useState<AnswerSummaryBlock[]>([]);
  const [generatedAnswers, setGeneratedAnswers] = useState<FullAnswer[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<'생성된 답변' | '유사 민원 답변'>('생성된 답변');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<FullAnswer | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // 데이터 로딩 함수를 useCallback으로 감싸서 재사용 가능하게 함
  const loadReplyData = useCallback(async (showLoadingSpinner = true) => {
    if (!id) return;
    if (showLoadingSpinner) {
      setLoading(true);
    }
    setError(null);
    try {
      const [complaintSummaryRes, replySummaryRes, repliesRes] = await Promise.all([
        fetchComplaintSummary(Number(id)),
        fetchReplySummary(Number(id)),
        fetchReplies(Number(id)),
      ]);

      const actualComplaintSummary = complaintSummaryRes.data.summary || '민원 요약 없음';
      // ✅✅✅ [핵심 수정] 백엔드 응답 구조에 맞게 데이터를 처리합니다. ✅✅✅
      // 백엔드는 민원 제목/내용을 /replies 엔드포인트에서 주지 않으므로, 다른 API 응답에서 가져옵니다.
      setComplaintTitle(complaintSummaryRes.data.title || '제목 없음');
      setComplaintContent(complaintSummaryRes.data.content || '내용 없음');
      setComplaintSummary(actualComplaintSummary);
      
      const rawSummary = replySummaryRes.data.summary || '[]';
      try {
        const parsedSummary = JSON.parse(rawSummary);
        setAnswerSummaryBlocks(Array.isArray(parsedSummary) && parsedSummary.length > 0 ? parsedSummary : [{ review: '', sections: [{ title: '가', text: '' }] }]);
      } catch {
        setAnswerSummaryBlocks([{ review: '', sections: [{ title: '가', text: '' }] }]);
      }

      // 백엔드는 `repliesRes.data`에 답변 배열을 직접 반환합니다.
      // `generated_replies` 키가 없으므로 `repliesRes.data`를 바로 사용합니다.
      const rawAnswers = repliesRes.data || [];
      const processedAnswers = rawAnswers.map(reply => 
        convertBackendReplyToFullAnswer(reply, actualComplaintSummary)
      );
      setGeneratedAnswers(processedAnswers);

      // selected_reply 처리 로직은 백엔드 응답에 따라 조정이 필요할 수 있습니다.
      // 우선 이 부분은 주석 처리하거나, 백엔드 응답을 확인 후 수정합니다.
      // if (repliesRes.data.selected_reply) { ... }

      setSelectedAnswer(null);
      setCurrentPage(0);
      setIsEditing(false);

    } catch (err) {
      console.error('데이터 불러오기 실패', err);
      // 답변이 없는 경우(404)는 에러로 처리하지 않도록 분기
      if ((err as any).response?.status === 404) {
        setGeneratedAnswers([]);
      } else {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  }, [id]);

  // --- 데이터 최초 로딩 ---
  useEffect(() => {
    loadReplyData();
  }, [loadReplyData]);

  // --- 답변 요지 편집 핸들러 함수들 ---
  const handleReviewChange = (blockIndex: number, value: string) => {
    setAnswerSummaryBlocks(prev =>
      prev.map((block, i) =>
        i === blockIndex ? { ...block, review: value } : block
      )
    );
  };

  const handleSectionChange = (blockIndex: number, sectionIndex: number, value: string) => {
    setAnswerSummaryBlocks(prev =>
      prev.map((block, i) => {
        if (i !== blockIndex) return block;
        const newSections = block.sections.map((section, j) =>
          j === sectionIndex ? { ...section, text: value } : section
        );
        return { ...block, sections: newSections };
      })
    );
  };

  const handleAddSection = (blockIndex: number) => {
    const labels = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];
    setAnswerSummaryBlocks(prev =>
      prev.map((block, i) => {
        if (i !== blockIndex) return block;
        const nextLabel = labels[block.sections.length] || '•';
        const newSection = { title: nextLabel, text: '' };
        return { ...block, sections: [...block.sections, newSection] };
      })
    );
  };

  const handleDeleteSection = (blockIndex: number, sectionIndex: number) => {
    const labels = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];
    setAnswerSummaryBlocks(prev => {
      const targetBlock = prev[blockIndex];
      const updatedSections = targetBlock.sections.filter((_, i) => i !== sectionIndex);

      if (updatedSections.length === 0) {
        const newBlocks = prev.filter((_, i) => i !== blockIndex);
        if (newBlocks.length === 0) {
          return [{ review: '', sections: [{ title: '가', text: '' }] }];
        }
        return newBlocks;
      } else {
        return prev.map((block, i) => {
          if (i !== blockIndex) return block;
          return {
            ...block,
            sections: updatedSections.map((section, j) => ({
              ...section,
              title: labels[j] || '•',
            })),
          };
        });
      }
    });
  };
  
  const handleAddBlock = () => {
    setAnswerSummaryBlocks(prev => [
      ...prev,
      { review: '', sections: [{ title: '가', text: '' }] },
    ]);
  };

  // 저장 로직에서 새로운 헬퍼 함수 사용
  const saveAnswer = async (status: '수정중' | '답변완료') => {
    const confirmMessage = status === REPLY_STATUS.COMPLETED ? '답변을 완료하시겠습니까?' : '답변을 보류하고 목록으로 이동할까요?';
    if (window.confirm(confirmMessage)) {
      if (!id || !selectedAnswer) return;
      try {
        const finalAnswerString = fullAnswerToString(selectedAnswer);
        
        await Promise.all([
          // 1. 최종 선택된 답변 저장 (백엔드 API가 이 이름으로 답변 본문을 저장한다고 가정)
          updateReplySummary(Number(id), finalAnswerString), 
          // 2. 편집된 답변 요지도 함께 저장
          saveReplySummary(Number(id), { answer_summary: answerSummaryBlocks }),
          // 3. 민원 상태 변경
          updateReplyStatus(Number(id), status)
        ]);
        
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
  const handleRegenerate = async () => {
    if (!id) return;

    setIsGenerating(true);
    try {
      const payload = { answer_summary: answerSummaryBlocks };
      
      // 1. 현재 편집된 답변 요지를 먼저 서버에 저장
      await saveReplySummary(Number(id), payload);
      
      // 2. 저장된 최신 요지를 기반으로 답변 재생성을 요청
      await regenerateReply(Number(id));
      
      // 3. 재생성이 완료되면, 전체 답변 데이터를 다시 불러와 화면을 업데이트
      await loadReplyData(false); // 페이지 전체 로딩 스피너는 보이지 않게 함

    } catch (err) {
      console.error('답변 재생성 실패', err);
      alert('답변을 재생성하는 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 로딩 및 에러 처리는 여기서 먼저 수행 (Early Return)
  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  console.log('최종 출력 답변: ', generatedAnswers)

  // 최종 렌더링 JSX (하나의 return 문으로 통합)
  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto p-8 space-y-8 min-h-screen bg-slate-50 ml-[300px] p-4">
      <Header title={complaintTitle} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <LeftPanel 
          content={complaintContent} 
        />
        <RightPanel
          summary={complaintSummary}
          answerSummaryBlocks={answerSummaryBlocks}
          onReviewChange={handleReviewChange}
          onSectionChange={handleSectionChange}
          onAddSection={handleAddSection}
          onDeleteSection={handleDeleteSection}
          onAddBlock={handleAddBlock}
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