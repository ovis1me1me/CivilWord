import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { fetchComplaintSummary, updateReplySummary, updateReplyStatus, fetchReplies, fetchReplySummary, regenerateReply, saveReplySummary } from '../utils/api';
import Header from '../component/ComplaintDetail/Header';
import LeftPanel from '../component/AnswerSelect/LeftPanel';
import RightPanel from '../component/AnswerSelect/RightPanel';
import SegmentedControl from '../component/AnswerSelect/SegmentedControl';
import AnswerBox from '../component/AnswerSelect/AnswerBox';
// ContentBlock 타입을 import하여 명시적으로 사용합니다.
import { FullAnswer, createNewBlock, ContentBlock } from '../component/AnswerSelect/types';
import AnswerSelectActions from '../component/AnswerSelect/AnswerSelectActions';
import Spinner from '../component/Shared/Spinner';

// 이 페이지 내에서만 사용하는 타입 정의
interface AnswerSection {
  title: string;
  text: string;
}

interface AnswerSummaryBlock {
  index: string;
  section: AnswerSection[];
}

// 백엔드 데이터 구조를 프론트엔드에서 사용하는 FullAnswer 형태로 변환하는 헬퍼 함수
const convertBackendReplyToFullAnswer = (backendReply: any, complaintSummaryText: string): FullAnswer => {
  const content = backendReply?.content;

  // 기본 오류 처리
  if (typeof content !== 'object' || content === null) {
    return {
      greeting: '오류',
      complaintSummary: '오류',
      contentBlocks: [createNewBlock('답변 형식이 올바르지 않습니다.')],
      closing: '오류'
    };
  }

  const greeting = content.header || '인사말이 없습니다.';
  const body = content.body || '[]'; // body가 비어있을 경우 빈 JSON 배열로 처리
  const closing = content.footer || '끝맺음말이 없습니다.';
  
  // [오류 수정] contentBlocks의 타입을 ContentBlock[]으로 명시하여 'never[]' 오류를 해결합니다.
  let contentBlocks: ContentBlock[] = [];

  try {
    const parsedBody = JSON.parse(body);

    if (Array.isArray(parsedBody)) {
      contentBlocks = parsedBody.map(block => {
        return {
          id: uuidv4(),
          title: block.index || '', // 'index' 값을 'title'로 사용
          sections: (block.section || []).map(sec => ({
            id: uuidv4(),
            text: sec.text || '',
          }))
        };
      });
    }
  } catch (e) {
    console.error("본문(body) JSON 파싱 실패:", e);
    contentBlocks = [createNewBlock('답변 본문 형식에 오류가 있습니다.')];
  }

  return {
    greeting: greeting,
    complaintSummary: complaintSummaryText,
    contentBlocks: contentBlocks,
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
      setComplaintTitle(complaintSummaryRes.data.title || '제목 없음');
      setComplaintContent(complaintSummaryRes.data.content || '내용 없음');
      setComplaintSummary(actualComplaintSummary);
      
      const rawSummary = replySummaryRes.data.summary || '[]';
      try {
        const parsedSummary = JSON.parse(rawSummary);
        setAnswerSummaryBlocks(Array.isArray(parsedSummary) && parsedSummary.length > 0 ? parsedSummary : [{ index: '', section: [{ title: '가', text: '' }] }]);
      } catch {
        setAnswerSummaryBlocks([{ index: '', section: [{ title: '가', text: '' }] }]);
      }

      const rawAnswers = repliesRes.data || [];
      const processedAnswers = rawAnswers.map(reply => 
        convertBackendReplyToFullAnswer(reply, actualComplaintSummary)
      );
      setGeneratedAnswers(processedAnswers);

      setSelectedAnswer(null);
      setCurrentPage(0);
      setIsEditing(false);

    } catch (err) {
      console.error('데이터 불러오기 실패', err);
      if ((err as any).response?.status === 404) {
        setGeneratedAnswers([]);
      } else {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReplyData();
  }, [loadReplyData]);

  // --- 답변 요지 편집 핸들러 함수들 (오류 수정) ---
  const handleIndexChange = (blockIndex: number, value: string) => {
    setAnswerSummaryBlocks(prev =>
      prev.map((block, i) =>
        i === blockIndex ? { ...block, index: value } : block
      )
    );
  };

  const handleSectionChange = (blockIndex: number, sectionIndex: number, value: string) => {
    setAnswerSummaryBlocks(prev =>
      prev.map((block, i) => {
        if (i !== blockIndex) return block;
        const newSections = block.section.map((sectionItem, j) =>
          j === sectionIndex ? { ...sectionItem, text: value } : sectionItem
        );
        return { ...block, section: newSections };
      })
    );
  };

  const handleAddSection = (blockIndex: number) => {
    const labels = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];
    setAnswerSummaryBlocks(prev =>
      prev.map((block, i) => {
        if (i !== blockIndex) return block;
        const nextLabel = labels[block.section.length] || '•';
        const newSection = { title: nextLabel, text: '' };
        return { ...block, section: [...block.section, newSection] };
      })
    );
  };

  const handleDeleteSection = (blockIndex: number, sectionIndex: number) => {
    const labels = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];
    setAnswerSummaryBlocks(prev => {
      const targetBlock = prev[blockIndex];
      const updatedSections = targetBlock.section.filter((_, i) => i !== sectionIndex);

      if (updatedSections.length === 0) {
        const newBlocks = prev.filter((_, i) => i !== blockIndex);
        if (newBlocks.length === 0) {
          return [{ index: '', section: [{ title: '가', text: '' }] }];
        }
        return newBlocks;
      } else {
        return prev.map((block, i) => {
          if (i !== blockIndex) return block;
          return {
            ...block,
            section: updatedSections.map((sectionItem, j) => ({
              ...sectionItem,
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
      { index: '', section: [{ title: '가', text: '' }] },
    ]);
  };

  const saveAnswer = async (status: '수정중' | '답변완료') => {
    const confirmMessage = status === REPLY_STATUS.COMPLETED ? '답변을 완료하시겠습니까?' : '답변을 보류하고 목록으로 이동할까요?';
    if (window.confirm(confirmMessage)) {
      if (!id || !selectedAnswer) return;
      try {
        const finalAnswerString = fullAnswerToString(selectedAnswer);
        
        await Promise.all([
          updateReplySummary(Number(id), finalAnswerString), 
          saveReplySummary(Number(id), { answer_summary: answerSummaryBlocks }),
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
      
      await saveReplySummary(Number(id), payload);
      await regenerateReply(Number(id));
      await loadReplyData(false);

    } catch (err) {
      console.error('답변 재생성 실패', err);
      alert('답변을 재생성하는 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;

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
          onReviewChange={handleIndexChange} // [오류 수정] onReviewChange -> onIndexChange
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
          <AnswerBox
            content={selectedAnswer ?? generatedAnswers[currentPage]}
            onChange={setSelectedAnswer}
            isEditing={isEditing}
            onEdit={() => {
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
