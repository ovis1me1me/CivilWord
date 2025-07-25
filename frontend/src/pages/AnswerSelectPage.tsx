import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  fetchComplaintSummary,
  updateReplyContent,
  updateReplyStatus,
  fetchReplies,
  fetchReplySummary,
  regenerateReply,
  saveReplySummary,
  fetchSimilarHistories,
} from '../utils/api';
import Header from '../component/ComplaintDetail/Header';
import LeftPanel from '../component/AnswerSelect/LeftPanel';
import RightPanel from '../component/AnswerSelect/RightPanel';
import SegmentedControl from '../component/AnswerSelect/SegmentedControl';
import AnswerBox from '../component/AnswerSelect/AnswerBox';
import { FullAnswer, createNewBlock, ContentBlock } from '../component/AnswerSelect/types';
import AnswerSelectActions from '../component/AnswerSelect/AnswerSelectActions';
import Spinner from '../component/Shared/Spinner';
import SimilarAnswersBlock from '../component/AnswerSelect/SimilarAnswersBlock';

interface AnswerSection {
  title: string;
  text: string;
}

interface AnswerSummaryBlock {
  index: string;
  section: AnswerSection[];
}

// ✅ 수정된: stripIdsFromAnswer
const stripIdsFromAnswer = (answer: FullAnswer) => {
  const sectionLabel = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];

  return {
    header: answer.header,
    summary: answer.summary,
    body: answer.body.map((block, blockIdx) => ({
      index: block.title,
      section: block.sections.map((sec, secIdx) => ({
        title: sectionLabel[secIdx] || `•`,
        text: sec.text
      }))
    })),
    footer: answer.footer
  };
};

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

  const convertBackendReplyToFullAnswer = (backendReply: any, complaintSummaryText: string): FullAnswer => {
    const content = backendReply?.content;
    if (typeof content !== 'object' || content === null) {
      return {
        header: '오류',
        summary: '오류',
        body: [createNewBlock('답변 형식이 올바르지 않습니다.')],
        footer: '오류'
      };
    }

    const greeting = content.header || '인사말이 없습니다.';
    const body = content.body || [];
    const closing = content.footer || '끝맺음말이 없습니다.';
    // ✅ 수정된 부분: 백엔드에서 보낸 content.summary를 사용합니다.
    const replySummaryFromBackend = content.summary || '요약 없음'; 

    let contentBlocks: ContentBlock[] = [];
    try {
      const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
      if (Array.isArray(parsedBody)) {
        contentBlocks = parsedBody.map(block => ({
          id: uuidv4(),
          title: block.index || '',
          sections: (block.section || []).map((sec: any) => ({
            id: uuidv4(),
            text: sec.text || ''
          }))
        }));
      }
    } catch (e) {
      console.error("본문(body) JSON 파싱 실패:", e);
      contentBlocks = [createNewBlock('답변을 재생성해주세요.')];
    }

    return {
      header: greeting,
      summary: replySummaryFromBackend, // 👈 이제 백엔드에서 재조립된 summary가 들어갑니다.
      body: contentBlocks,
      footer: closing
    };
  };

  // similarAnswersList의 타입을 백엔드 반환 형식에 맞게 수정합니다.
  const [similarAnswersList, setSimilarAnswersList] = useState<
    { title: string; summary: string; content: string }[]
  >([]);

  const loadReplyData = useCallback(async (showLoadingSpinner = true) => {
    if (!id) return;
    if (showLoadingSpinner) setLoading(true);
    setError(null);
    try {
      const [complaintSummaryRes, replySummaryRes, repliesRes, similarHistoryRes] = await Promise.all([
        fetchComplaintSummary(Number(id)),
        fetchReplySummary(Number(id)),
        fetchReplies(Number(id)),
        fetchSimilarHistories(Number(id)), // 유사 민원 이력 호출
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
      console.log('변환된 FullAnswer 객체들 (processedAnswers):', processedAnswers); // 확인용 로그 유지

      setSelectedAnswer(null);
      setCurrentPage(0);
      setIsEditing(false);

      // 유사 민원 이력 데이터를 상태에 저장합니다.
      setSimilarAnswersList(similarHistoryRes); 

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

  const handleIndexChange = (blockIndex: number, value: string) => {
    setAnswerSummaryBlocks(prev =>
      prev.map((block, i) => i === blockIndex ? { ...block, index: value } : block)
    );
  };

  const handleSectionChange = (blockIndex: number, sectionIndex: number, value: string) => {
    setAnswerSummaryBlocks(prev =>
      prev.map((block, i) => {
        if (i !== blockIndex) return block;
        const newSections = block.section.map((s, j) =>
          j === sectionIndex ? { ...s, text: value } : s
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
        return {
          ...block,
          section: [...block.section, { title: nextLabel, text: '' }]
        };
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
        return newBlocks.length === 0
          ? [{ index: '', section: [{ title: '가', text: '' }] }]
          : newBlocks;
      }
      return prev.map((block, i) => {
        if (i !== blockIndex) return block;
        return {
          ...block,
          section: updatedSections.map((s, j) => ({
            ...s,
            title: labels[j] || '•',
          })),
        };
      });
    });
  };

  const handleAddBlock = () => {
    setAnswerSummaryBlocks(prev => [
      ...prev,
      { index: '', section: [{ title: '가', text: '' }] }
    ]);
  };

  const saveAnswer = async (status: '수정중' | '답변완료') => {
    const confirmMessage = status === REPLY_STATUS.COMPLETED
      ? '답변을 완료하시겠습니까?'
      : '답변을 보류하고 목록으로 이동할까요?';

    if (window.confirm(confirmMessage)) {
      if (!id || !selectedAnswer) return;
      try {
        const answerWithoutIds = stripIdsFromAnswer(selectedAnswer);

        console.log('전송될 reply_content:', answerWithoutIds); // 확인용 로그 유지

        await Promise.all([
          updateReplyContent(Number(id), answerWithoutIds),
          //aveReplySummary(Number(id), { answer_summary: answerSummaryBlocks }),
          updateReplyStatus(Number(id), status)
        ]);

        navigate('/complaints');
      } catch (err) {
        console.error(`답변 ${status} 처리 실패`, err);
        alert('처리 중 오류가 발생했습니다.');
      }
    }
  };

  const handleReselect = () => {
    setSelectedAnswer(null);
    setIsEditing(false);
  };

  const handleHold = () => saveAnswer(REPLY_STATUS.EDITING);
  const handleComplete = () => saveAnswer(REPLY_STATUS.COMPLETED);

  const handleRegenerate = async () => {
    if (!id) return;
    setIsGenerating(true);
    try {
      await saveReplySummary(Number(id), { answer_summary: answerSummaryBlocks });
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
        <LeftPanel content={complaintContent} />
        <RightPanel
          summary={complaintSummary}
          answerSummaryBlocks={answerSummaryBlocks}
          onReviewChange={handleIndexChange}
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
          <div className="flex-1 p-4 bg-zinc-300 rounded"> {/* h-80 클래스를 제거합니다. */}
            <SimilarAnswersBlock
              index={0}
              similarAnswers={similarAnswersList} 
              // containerHeight={answerHeight} // 이 주석 처리된 부분을 완전히 제거합니다.
            />
          </div>
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
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`px-2 py-1 rounded text-xs ${currentPage === i ? 'bg-black text-white' : 'bg-gray-200'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}