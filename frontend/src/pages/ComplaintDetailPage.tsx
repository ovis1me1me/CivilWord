import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ContentBox from '../component/ComplaintDetail/ContentBox';
import AnswerBlock from '../component/ComplaintDetail/AnswerBlock';
import SimilarAnswersBlock from '../component/ComplaintDetail/SimilarAnswersBlock';
import Spinner from '../component/Shared/Spinner';
import { ComplaintDetail } from '../types/complaint';
import {
  fetchComplaintDetail,
  fetchComplaintSummary,
  saveReplySummary,
  generateReply,
  fetchSimilarHistories,
} from '../utils/api';

// (디자인) 첫 번째 파일에서 가져온 컴포넌트
import PageHeader from '../component/Common/PageHeader';
import ContentCenter from '../component/Common/ContentCenter';
import { FileText } from 'lucide-react';

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // (로직) 두 번째 파일에서 가져온 모든 state
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [similarAnswersList, setSimilarAnswersList] = useState<
    { title: string; summary: string; content: string }[]
  >([]);

  const answerContainerRef = useRef<HTMLDivElement>(null);
  const [answerHeight, setAnswerHeight] = useState(0);

  const [answerBlocks, setAnswerBlocks] = useState([
    { summaryTitle: '', answerOptions: [''] },
  ]);

  // (로직) 두 번째 파일에서 가져온 헬퍼 함수
  const makeLongSummary = (short: string) => {
    if (!short) return '';
    return `${short}\n\n[상세요약(임시)]: ${short}`;
  };

  // (로직) 두 번째 파일에서 가져온 데이터 로딩 useEffect
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const numericId = parseInt(id, 10);

        const [complaintRes, summaryRes] = await Promise.all([
          fetchComplaintDetail(numericId),
          fetchComplaintSummary(numericId),
        ]);

        const complaintData = complaintRes.data;

        const shortSummary: string = summaryRes?.data?.summary || '';
        const longSummaryApi: string | undefined = summaryRes?.data?.long_summary;
        const longSummary: string = longSummaryApi ?? makeLongSummary(shortSummary);

        const replySummary = '';

        setComplaint({
          id: complaintData.id,
          title: complaintData.title,
          content: complaintData.content,
          summary: longSummary,
          answerSummary: replySummary,
        });

        setAnswerBlocks([{ summaryTitle: shortSummary, answerOptions: [''] }]);

        if (shortSummary.trim()) {
          const similarHistoryRes = await fetchSimilarHistories(numericId);
          setSimilarAnswersList(similarHistoryRes);
        } else {
          setSimilarAnswersList([]);
        }
      } catch (err) {
        console.error('데이터 조회 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // (로직) 두 번째 파일에서 가져온 높이 조절 useEffect
  useEffect(() => {
    if (answerContainerRef.current) {
      setAnswerHeight(answerContainerRef.current.offsetHeight);
    }
  }, [answerBlocks]);

  // (로직) 두 번째 파일에서 가져온 모든 핸들러 함수
  const handleSummaryChange = (index: number, value: string) => {
    setAnswerBlocks(prev =>
      prev.map((block, i) =>
        i === index ? { ...block, summaryTitle: value } : block
      )
    );
  };

  const handleAddSummary = () => {
    setAnswerBlocks(prev => [
      ...prev,
      { summaryTitle: '', answerOptions: [''] },
    ]);
  };

  const handleAddAnswerOption = (index: number) => {
    setAnswerBlocks(prev =>
      prev.map((block, i) =>
        i === index
          ? { ...block, answerOptions: [...block.answerOptions, ''] }
          : block
      )
    );
  };

  const handleDeleteAnswerOption = (summaryIndex: number, answerIndex: number) => {
    setAnswerBlocks(prev => {
      const newBlocks = prev.map((block, i) => {
        if (i !== summaryIndex) return block;
        const updatedOptions = block.answerOptions.filter((_, idx) => idx !== answerIndex);
        return { ...block, answerOptions: updatedOptions };
      });

      const filteredBlocks = newBlocks.filter(
        (block) =>
          !(block.answerOptions.length === 0 && block.summaryTitle.trim() === '')
      );

      return filteredBlocks.length === 0 ? [{ summaryTitle: '', answerOptions: [''] }] : filteredBlocks;
    });
  };

  const handleAnswerOptionChange = (
    summaryIndex: number,
    answerIndex: number,
    value: string
  ) => {
    setAnswerBlocks(prev =>
      prev.map((block, i) =>
        i === summaryIndex
          ? {
              ...block,
              answerOptions: block.answerOptions.map((option, idx) =>
                idx === answerIndex ? value : option
              ),
            }
          : block
      )
    );
  };

  const handleGenerateAnswer = async () => {
    if (!id) return;

    const hasAtLeastOneFilled = answerBlocks.some(
      (block) => block.summaryTitle.trim() !== ''
    );

    if (!hasAtLeastOneFilled) {
      alert('최소 하나 이상의 답변 요지를 입력해야 합니다.');
      return;
    }

    setIsGenerating(true);

    try {
      const numericId = parseInt(id, 10);
      const labels = ['•'];
      const payload = {
        answer_summary: answerBlocks
          .map((block) => {
            const filledOptions = block.answerOptions.filter(
              (opt) => opt.trim() !== ''
            );
            if (block.summaryTitle.trim() === '' || filledOptions.length === 0) {
              return null;
            }
            return {
              index: block.summaryTitle,
              section: filledOptions.map((opt, index) => ({
                title: labels[index] || '',
                text: opt,
              })),
            };
          })
          .filter(
            (item): item is { index: string; section: { title: string; text: string }[] } => item !== null
          ),
      };

      console.log('보내는 payload:', JSON.stringify(payload, null, 2));
      await saveReplySummary(numericId, payload);

      const replyResponse = await generateReply(numericId, payload);
      console.log('생성된 답변:', replyResponse.data);

      navigate(`/complaints/${id}/select-answer`, {
        state: { summaries: answerBlocks.map((block) => block.summaryTitle) },
      });
    } catch (error) {
      console.error('답변 요지 저장 실패:', error);
      alert('답변 요지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectFromSimilar = (payload: { summaryTitle: string; answerOptions: string[] }) => {
    const { summaryTitle, answerOptions } = payload;
    const safeOptions = (answerOptions?.length ? answerOptions : ['']).slice(0);

    setAnswerBlocks(prev => {
      const next = [...prev];
      if (next.length === 0) {
        return [{ summaryTitle, answerOptions: safeOptions }];
      }
      next[0] = { summaryTitle, answerOptions: safeOptions };
      return next;
    });

    requestAnimationFrame(() => {
      const el = document.querySelector('[data-answer-container="true"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  if (isLoading || !complaint) {
    return <Spinner />;
  }

  // (디자인) 첫 번째 파일에서 가져온 '목록으로' 버튼
  const backButton = (
    <button
      onClick={() => navigate('/complaints')}
      className="bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
    >
      목록으로
    </button>
  );

  // (디자인) 첫 번째 파일에서 가져온 JSX (return 문)
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <PageHeader
        title={complaint.title}
        icon={<FileText size={30} className="text-white drop-shadow-md" />}
        hasSidebar={true}
        maxWidthClass="max-w-[1000px]"
        rightContent={backButton}
      />

      <ContentCenter
        hasSidebar={true}
        maxWidthClass="max-w-[1000px]"
      >
        <div className="bg-white p-6 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.1)] w-full space-y-6 relative mt-8">
          <ContentBox label="민원 내용" content={complaint.content} />
          <ContentBox label="민원 요지" content={complaint.summary} />

          <div className="grid md:grid-cols-2 gap-6">
            <SimilarAnswersBlock
              index={0}
              similarAnswers={similarAnswersList}
              containerHeight={answerHeight}
              onSelect={handleSelectFromSimilar}
            />

            <div ref={answerContainerRef} className="flex flex-col gap-6" data-answer-container="true">
              {answerBlocks.map((block, index) => (
                <AnswerBlock
                  key={index}
                  index={index}
                  summaryTitle={block.summaryTitle}
                  answerOptions={block.answerOptions}
                  onSummaryChange={(value) => handleSummaryChange(index, value)}
                  onAddAnswer={() => handleAddAnswerOption(index)}
                  onDeleteAnswer={(answerIndex) =>
                    handleDeleteAnswerOption(index, answerIndex)
                  }
                  onAnswerChange={(answerIndex, value) =>
                    handleAnswerOptionChange(index, answerIndex, value)
                  }
                  onAddSummary={handleAddSummary}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerateAnswer}
              disabled={isGenerating}
              className={`w-1/5 flex justify-center gap-2 px-6 py-2 rounded-lg font-semibold ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-zinc-600 transition'
              }`}
            >
              {isGenerating ? '답변 생성 중' : '답변 생성'}
              {isGenerating && <Spinner />}
            </button>
          </div>
        </div>
      </ContentCenter>
    </div>
  );
}