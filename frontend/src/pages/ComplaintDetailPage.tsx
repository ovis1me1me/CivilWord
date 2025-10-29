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

import ContentCenter from '../component/Common/ContentCenter';
import { FileText } from 'lucide-react';

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  const makeLongSummary = (short: string) => {
    if (!short) return '';
    return `${short}\n\n[상세요약(임시)]: ${short}`;
  };

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

  useEffect(() => {
    if (answerContainerRef.current) {
      setAnswerHeight(answerContainerRef.current.offsetHeight);
    }
  }, [answerBlocks]);

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
      const next = prev.map((block, i) => {
        if (i !== summaryIndex) return block;
        const updated = block.answerOptions.filter((_, idx) => idx !== answerIndex);
        return { ...block, answerOptions: updated };
      });

      const target = next[summaryIndex];

      if (target && target.answerOptions.length === 0) {
        if (next.length === 1) {
          next[0] = { ...next[0], answerOptions: [''] };
          return next;
        }

        if ((target.summaryTitle ?? '').trim() === '') {
          next.splice(summaryIndex, 1);
          return next;
        }

        next[summaryIndex] = { ...target, answerOptions: [''] };
        return next;
      }

      return next;
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

    // 제목 / 내용 각각 검사
    const hasEmptyTitle = answerBlocks.some(block => block.summaryTitle.trim() === '');
    const hasEmptyContent = answerBlocks.some(
      block => block.answerOptions.every(opt => opt.trim() === '')
    );

    if (hasEmptyTitle) {
      alert('요지 제목을 입력해주세요.');
      return;
    }

    if (hasEmptyContent) {
      alert('요지 내용을 입력해주세요.');
      return;
    }

    setIsGenerating(true);

    try {
      const numericId = parseInt(id, 10);
      const bullet = '•';

      const payload = {
        answer_summary: answerBlocks.map(block => ({
          index: block.summaryTitle.trim(),
          section: block.answerOptions
            .filter(opt => opt.trim() !== '')
            .map(opt => ({
              title: bullet,
              text: opt,
            })),
        })),
      };

      console.log('보내는 payload:', JSON.stringify(payload, null, 2));

      await saveReplySummary(numericId, payload);
      const replyResponse = await generateReply(numericId, payload);

      console.log('생성된 답변:', replyResponse.data);

      navigate(`/complaints/${id}/select-answer`, {
        state: { summaries: payload.answer_summary.map(s => s.index) },
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

  const backButton = (
    <button
      onClick={() => navigate('/complaints')}
      className="bg-gradient-to-r from-gov-950 via-gov-800 to-gov-700 hover:opacity-90 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
    >
      목록으로
    </button>
  );

  return (
    <div className="min-h-screen pb-12">

      <ContentCenter hasSidebar={true} maxWidthClass="max-w-[1000px]">
        <div className="bg-white p-6 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.1)] w-full space-y-6 relative mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={26} className="text-gov-800" />
              <h1 className="text-xl md:text-2xl font-semibold text-blue-950">
                {complaint.title}
              </h1>
            </div>
            {backButton}
          </div>

          {/* 구분선 */}
          <div className="border-b-4 border-gov-800 rounded-sm shadow-sm mt-4 mb-4 opacity-90" />

          {/* 본문 컨텐츠 */}
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
                  ? 'bg-blue-900 cursor-not-allowed'
                  : 'bg-gradient-to-r from-gov-950 via-gov-800 to-gov-700 hover:opacity-90 text-white transition'
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