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
// --- 디자인 수정: 'Header' 대신 'PageHeader' 등을 임포트 ---
// import Header from '../component/ComplaintDetail/Header'; // 기존 헤더 (제거)
import LeftPanel from '../component/AnswerSelect/LeftPanel';
import RightPanel from '../component/AnswerSelect/RightPanel';
import SegmentedControl from '../component/AnswerSelect/SegmentedControl';
import AnswerBox from '../component/AnswerSelect/AnswerBox';
import {
  FullAnswer,
  createNewBlock,
  ContentBlock,
} from '../component/AnswerSelect/types';
import AnswerSelectActions from '../component/AnswerSelect/AnswerSelectActions';
import Spinner from '../component/Shared/Spinner';
import SimilarAnswersBlock from '../component/AnswerSelect/SimilarAnswersBlock';
import QualityRatingModal from '../component/AnswerSelect/QualityRatingModal';

// --- 디자인 수정: 새 레이아웃 컴포넌트 및 아이콘 임포트 ---
// import PageHeader from '../component/Common/PageHeader'; // --- 디자인 수정: PageHeader 임포트 제거 ---
import ContentCenter from '../component/Common/ContentCenter';
import { FileText } from 'lucide-react';

// --- Interfaces ---
interface AnswerSection {
  title: string;
  text: string;
}
interface AnswerSummaryBlock {
  index: string;
  section: AnswerSection[];
}

// --- Helper Functions ---
const stripIdsFromAnswer = (answer: FullAnswer) => {
  return {
    header: answer.header,
    summary: answer.summary,
    body: answer.body.map((block, blockIdx) => ({
      index: block.title,
      section: block.sections.map((sec, secIdx) => ({
        title: '•',
        text: sec.text,
      })),
    })),
    footer: answer.footer,
  };
};

const REPLY_STATUS = {
  EDITING: '수정중',
  COMPLETED: '답변완료',
} as const;

// --- Component ---
export default function AnswerSelectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // --- State (기존 로직 유지) ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintContent, setComplaintContent] = useState('');
  const [complaintSummary, setComplaintSummary] = useState('');
  const [answerSummaryBlocks, setAnswerSummaryBlocks] = useState<
    AnswerSummaryBlock[]
  >([]);
  const [generatedAnswers, setGeneratedAnswers] = useState<FullAnswer[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<
    '생성된 답변' | '유사 민원 답변'
  >('생성된 답변');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<FullAnswer | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false); // ✅ 기존 기능
  const [similarAnswersList, setSimilarAnswersList] = useState<
    { title: string; summary: string; content: string }[]
  >([]);

  // --- Data Conversion (기존 로직 유지) ---
  const convertBackendReplyToFullAnswer = (backendReply: any): FullAnswer => {
    const content = backendReply?.content;
    if (typeof content !== 'object' || content === null) {
      return {
        header: '오류',
        summary: '오류',
        body: [createNewBlock('답변 형식이 올바르지 않습니다.')],
        footer: '오류',
      };
    }

    const greeting = content.header || '인사말이 없습니다.';
    const body = content.body || [];
    const closing = content.footer || '끝맺음말이 없습니다.';
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
            title: '•',
            text: sec.text || '',
          })),
        }));
      }
    } catch (e) {
      console.error('본문(body) JSON 파싱 실패:', e);
      contentBlocks = [createNewBlock('답변을 재생성해주세요.')];
    }

    return {
      header: greeting,
      summary: replySummaryFromBackend,
      body: contentBlocks,
      footer: closing,
    };
  };

  // --- Data Loading (기존 로직 유지) ---
  const loadReplyData = useCallback(async (showLoadingSpinner = true) => {
    if (!id) return;
    if (showLoadingSpinner) setLoading(true);
    setError(null);
    try {
      const [
        complaintSummaryRes,
        replySummaryRes,
        repliesRes,
        similarHistoryRes,
      ] = await Promise.all([
        fetchComplaintSummary(Number(id)),
        fetchReplySummary(Number(id)),
        fetchReplies(Number(id)),
        fetchSimilarHistories(Number(id)),
      ]);

      const actualComplaintSummary =
        complaintSummaryRes.data.summary || '민원 요약 없음';
      setComplaintTitle(complaintSummaryRes.data.title || '제목 없음');
      setComplaintContent(complaintSummaryRes.data.content || '내용 없음');
      setComplaintSummary(actualComplaintSummary);

      const rawSummary = replySummaryRes.data.summary || '[]';
      try {
        const parsedSummary = JSON.parse(rawSummary);
        setAnswerSummaryBlocks(
          Array.isArray(parsedSummary) && parsedSummary.length > 0
            ? parsedSummary
            : [{ index: '', section: [{ title: '가', text: '' }] }]
        );
      } catch {
        setAnswerSummaryBlocks([
          { index: '', section: [{ title: '가', text: '' }] },
        ]);
      }

      const rawAnswers = repliesRes.data || [];
      const processedAnswers = rawAnswers.map(reply =>
        convertBackendReplyToFullAnswer(reply)
      );
      setGeneratedAnswers(processedAnswers);
      console.log('변환된 FullAnswer 객체들 (processedAnswers):', processedAnswers); // 기존 로그

      setSelectedAnswer(null);
      setCurrentPage(0);
      setIsEditing(false);

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

  // --- Event Handlers (RightPanel) (기존 로직 유지) ---
  const handleIndexChange = (blockIndex: number, value: string) => {
    setAnswerSummaryBlocks(prev =>
      prev.map((block, i) =>
        i === blockIndex ? { ...block, index: value } : block
      )
    );
  };
  const handleSectionChange = (
    blockIndex: number,
    sectionIndex: number,
    value: string
  ) => {
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
    setAnswerSummaryBlocks(prev =>
      prev.map((block, i) => {
        if (i !== blockIndex) return block;
        return {
          ...block,
          section: [...block.section, { title: '•', text: '' }],
        };
      })
    );
  };
  const handleDeleteSection = (blockIndex: number, sectionIndex: number) => {
    setAnswerSummaryBlocks(prev => {
      const targetBlock = prev[blockIndex];
      const updatedSections = targetBlock.section.filter(
        (_, i) => i !== sectionIndex
      );
      if (updatedSections.length === 0) {
        const newBlocks = prev.filter((_, i) => i !== blockIndex);
        return newBlocks.length === 0
          ? [{ index: '', section: [{ title: '•', text: '' }] }]
          : newBlocks;
      }
      return prev.map((block, i) => {
        if (i !== blockIndex) return block;
        return {
          ...block,
          section: updatedSections.map((s, j) => ({
            ...s,
            title: '•',
          })),
        };
      });
    });
  };
  const handleAddBlock = () => {
    setAnswerSummaryBlocks(prev => [
      ...prev,
      { index: '', section: [{ title: '•', text: '' }] },
    ]);
  };
  const handleRegenerate = async () => {
    if (!id) return;
    setIsGenerating(true);
    try {
      await saveReplySummary(Number(id), {
        answer_summary: answerSummaryBlocks,
      });
      await regenerateReply(Number(id));
      await loadReplyData(false);
    } catch (err) {
      console.error('답변 재생성 실패', err);
      alert('답변을 재생성하는 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Event Handlers (Page Actions) (기존 로직 유지) ---
  const saveAnswer = async (status: '수정중' | '답변완료', rating?: number) => {
    if (!id || !selectedAnswer) return;
    try {
      const answerWithoutIds = stripIdsFromAnswer(selectedAnswer);
      console.log('전송될 reply_content:', answerWithoutIds); // 기존 로그
      await Promise.all([
        updateReplyContent(Number(id), answerWithoutIds),
        updateReplyStatus(Number(id), status, rating),
      ]);
      navigate('/complaints');
    } catch (err) {
      console.error(`답변 ${status} 처리 실패`, err);
      alert('처리 중 오류가 발생했습니다.');
    }
  };
  const handleReselect = () => {
    setSelectedAnswer(null);
    setIsEditing(false);
  };
  const handleHold = () => {
    const confirmMessage = '답변을 보류하고 목록으로 이동할까요?'; // 기존 로직
    if (window.confirm(confirmMessage)) {
      saveAnswer(REPLY_STATUS.EDITING);
    }
  };
  const handleComplete = () => {
    if (window.confirm('답변을 완료하시겠습니까?')) {
      setShowRatingModal(true);
    }
  };
  const handleRatingSubmit = (rating: number) => { // ✅ 기존 기능
    setShowRatingModal(false);
    saveAnswer(REPLY_STATUS.COMPLETED, rating);
  };
  const handleCloseRatingAndNavigate = () => { // ✅ 기존 기능
    setShowRatingModal(false);
    navigate('/complaints');
  };

  // --- Render Loading/Error (기존 로직 유지) ---
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );

  // --- 디자인 수정: '목록으로' 버튼 변수 생성 (ComplaintDetailPage 스타일 적용) ---
  const backButton = (
    <button
      onClick={() => navigate('/complaints')}
      className="bg-gradient-to-r from-gov-950 via-gov-800 to-gov-700 hover:opacity-90 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
    >
      목록으로
    </button>
  );

  // --- Render Page ---
  return (
    <div className="min-h-screen pb-12">

      <ContentCenter hasSidebar={true} maxWidthClass="max-w-[1000px]">
        <div className="bg-white p-6 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.1)] w-full space-y-6 relative mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={26} className="text-gov-800" />
              <h1 className="text-xl md:text-2xl font-semibold text-blue-950">
                {complaintTitle}
              </h1>
            </div>
            {backButton}
          </div>

          {/* --- 디자인 수정: 구분선 추가 --- */}
          <div className="border-b-4 border-gov-800 rounded-sm shadow-sm mt-4 mb-4 opacity-90" />
          
          {/* --- 기존 로직: 좌/우 패널 (스타일 래퍼만 변경됨) --- */}
          <div className="flex flex-col grid md:grid-cols-2 gap-8">
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

          {/* --- 기존 로직: 탭 컨트롤 --- */}
          <div className="flex justify-start">
            <SegmentedControl
              selected={selectedSegment}
              setSelected={setSelectedSegment}
            />
          </div>

          {/* --- 기존 로직: 답변 선택 영역 --- */}
          <div className="flex relative min-h-[384px]">
            {selectedSegment === '생성된 답변' && generatedAnswers.length > 0 && (
              <AnswerBox
                content={selectedAnswer ?? generatedAnswers[currentPage]}
                onChange={setSelectedAnswer}
                isEditing={isEditing}
                onEdit={() => {
                  setSelectedAnswer(
                    JSON.parse(JSON.stringify(generatedAnswers[currentPage]))
                  );
                  setIsEditing(true);
                }}
              />
            )}

            {/* --- 디자인 수정: '생성된 답변 없음' 스타일 --- */}
            {selectedSegment === '생성된 답변' &&
              generatedAnswers.length === 0 &&
              !loading && (
                <div className="flex items-center justify-center w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                  생성된 답변이 없습니다.
                </div>
              )}

            {/* --- 디자인 수정: '유사 민원 답변' 래퍼 스타일 --- */}
            {selectedSegment === '유사 민원 답변' && (
              <div className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <SimilarAnswersBlock
                  index={0}
                  similarAnswers={similarAnswersList}
                 // onSelect prop은 여기서 제외합니다 (오류 방지)
                />
              </div>
            )}

            {/* --- 기존 로직: 재생성 스피너 --- */}
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 rounded">
                <Spinner />
              </div>
            )}
          </div>

          {/* --- 기존 로직: 하단 액션 버튼 또는 페이지네이션 --- */}
          {selectedAnswer ? (
            <AnswerSelectActions
              onReselect={handleReselect}
              onHold={handleHold}
              onComplete={handleComplete}
            />
          ) : (
            generatedAnswers.length > 1 && (
              <div className="flex justify-center gap-2">
                {generatedAnswers.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    // --- 디자인 수정: 페이지네이션 버튼 스타일 ---
                    className={`px-2 py-1 rounded text-xs transition ${
                      currentPage === i
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </ContentCenter>

      {/* --- 기존 로직: 품질 평가 모달 --- */}
      {showRatingModal && (
        <QualityRatingModal
          onClose={handleCloseRatingAndNavigate}
          onRatingSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
}