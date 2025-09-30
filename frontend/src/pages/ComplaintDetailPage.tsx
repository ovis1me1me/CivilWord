import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../component/ComplaintDetail/Header';
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
  fetchSimilarHistories, // 새로 추가된 API 함수 임포트
} from '../utils/api';

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // similarAnswersList의 타입을 백엔드 반환 형식에 맞게 수정합니다.
  const [similarAnswersList, setSimilarAnswersList] = useState<
    { title: string; summary: string; content: string }[]
  >([]);

  const answerContainerRef = useRef<HTMLDivElement>(null);
  const [answerHeight, setAnswerHeight] = useState(0);

  // 민원 요지 + 답변 요지
  const [answerBlocks, setAnswerBlocks] = useState([
    { summaryTitle: '', answerOptions: [''] },
  ]);

  // ✅ 긴 요약이 없을 때 임시로 만들어주는 헬퍼
  const makeLongSummary = (short: string) => {
    if (!short) return '';
    // 임시(하드코딩) 정책: 짧은 요약을 한 번 더 붙여서 길게 보이도록
    return `${short}\n\n[상세요약(임시)]: ${short}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const numericId = parseInt(id, 10);

        // 1️⃣ complaint + summary만 먼저 가져온다
        const [complaintRes, summaryRes] = await Promise.all([
          fetchComplaintDetail(numericId),
          fetchComplaintSummary(numericId),
        ]);

        const complaintData = complaintRes.data;

        // 백엔드에서 내려주는 요약들
        const shortSummary: string = summaryRes?.data?.summary || '';        // 짧은 요약 (답변요지의 summaryTitle에 사용)
        const longSummaryApi: string | undefined = summaryRes?.data?.long_summary; // 긴 요약 (있으면 사용)
        const longSummary: string = longSummaryApi ?? makeLongSummary(shortSummary);

        const replySummary = '';

        // ✅ 화면의 “민원 요지” 박스에는 긴 요약(longSummary)을 표시
        setComplaint({
          id: complaintData.id,
          title: complaintData.title,
          content: complaintData.content,
          summary: longSummary,       // 화면 노출용 긴 요약
          answerSummary: replySummary,
        });

        // ✅ 요구 1: 답변요지(AnswerBlock)의 summaryTitle 초기값에 “짧은 요약” 주입
        setAnswerBlocks([{ summaryTitle: shortSummary, answerOptions: [''] }]);

        // 2️⃣ summary(짧은 요약)가 있을 때만 유사민원 API 호출
        if (shortSummary.trim()) {
          const similarHistoryRes = await fetchSimilarHistories(numericId);
          setSimilarAnswersList(similarHistoryRes);
        } else {
          setSimilarAnswersList([]); // 없을 경우 빈 배열
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

  // 민원 요약 입력 (AnswerBlock의 summaryTitle)
  const handleSummaryChange = (index: number, value: string) => {
    setAnswerBlocks(prev =>
      prev.map((block, i) =>
        i === index ? { ...block, summaryTitle: value } : block
      )
    );
  };

  // 답변 추가
  const handleAddSummary = () => {
    setAnswerBlocks(prev => [
      ...prev,
      { summaryTitle: '', answerOptions: [''] },
    ]);
  };

  // 답변 요지 추가
  const handleAddAnswerOption = (index: number) => {
    setAnswerBlocks(prev =>
      prev.map((block, i) =>
        i === index
          ? { ...block, answerOptions: [...block.answerOptions, ''] }
          : block
      )
    );
  };

  // 답변 요지 삭제
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

  // 답변 요지 입력
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

  // 답변 생성
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

  // ✅ 유사 민원에서 '답변 선택' 눌렀을 때 반영
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

  return (
    <div className="ml-[250px] p-4">
      <div className="p-4 max-w-[1000px] mx-auto space-y-6 relative">
        <Header title={complaint.title} />
        <ContentBox label="민원 내용" content={complaint.content} />
        {/* ✅ 화면에는 긴 요약을 노출 */}
        <ContentBox label="민원 요지" content={complaint.summary} />

        <div className="grid md:grid-cols-2 gap-6 max-w-[1000px] mx-auto">
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
                summaryTitle={block.summaryTitle}          // ✅ 짧은 요약이 들어감
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
    </div>
  );
}
