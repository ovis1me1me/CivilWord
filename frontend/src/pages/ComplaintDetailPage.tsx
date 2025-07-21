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
} from '../utils/api';

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [similarAnswersList, setSimilarAnswersList] = useState<string[][][]>([
    [
      ['도로 정비 요청 완료', '이관 완료', '유사 민원 답변'],
      ['정비는 3일 내 착수 예정', '추가 민원은 필요 없음'],
      ['유사 민원 답변', '유사 민원 답변'],
    ],
  ]);

  const answerContainerRef = useRef<HTMLDivElement>(null);
  const [answerHeight, setAnswerHeight] = useState(0);

  // 민원 요지 + 답변 요지
  const [answerBlocks, setAnswerBlocks] = useState([
    { summaryTitle: '', answerOptions: [''] },
  ]);

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
        const summary = summaryRes.data.summary || '';
        const replySummary = complaintData.reply_summary || '';

        setComplaint({
          id: complaintData.id,
          title: complaintData.title,
          content: complaintData.content,
          summary: summary,
          answerSummary: replySummary,
        });

        setAnswerBlocks([{ summaryTitle: replySummary, answerOptions: ['', '', ''] }]);
      } catch (err) {
        console.error('민원 상세 조회 실패:', err);
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

  // 민원 요약 입력
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
      { summaryTitle: '', answerOptions: ['','',''] },
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
    setAnswerBlocks(prev =>
      prev.map((block, i) =>
        i === summaryIndex
          ? {
              ...block,
              answerOptions: block.answerOptions.filter(
                (_, idx) => idx !== answerIndex
              ),
            }
          : block
      )
    );
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
  const handleGenerateAnswer = () => {
    setIsGenerating(true);
    setTimeout(() => {
      navigate(`/complaints/${id}/select-answer`, {
        state: { summaries: answerBlocks.map(block => block.summaryTitle) },
      });
    }, 2000);
  };

  if (isLoading || !complaint) {
    return <Spinner />;
  }

  return (
    <div className="ml-[250px] p-4">
      <div className="p-4 max-w-[1000px] mx-auto space-y-6 relative">
        <Header complaintId={complaint.id} title={complaint.title} />
        <ContentBox content={complaint.content} />
        <ContentBox label="민원 요지" content={complaint.summary} />

        <div className="grid grid-cols-2 gap-6 max-w-[1000px] mx-auto p-4">
          <SimilarAnswersBlock
            index={0}
            similarAnswers={similarAnswersList[0] || []}
            containerHeight={answerHeight}
          />

          <div ref={answerContainerRef} className="flex flex-col gap-6">
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
                : 'bg-black text-white hover:bg-gray-800 transition'
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
