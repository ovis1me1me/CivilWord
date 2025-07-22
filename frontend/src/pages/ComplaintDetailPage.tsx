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
} from '../utils/api';

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 더미
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

  const handleGenerateAnswer = async () => {
    if (!id) return;

    const hasAtLeastOneFilled = answerBlocks.some(
      block => block.summaryTitle.trim() !== ''
    );

    if (!hasAtLeastOneFilled) {
      alert('최소 하나 이상의 답변 요지를 입력해야 합니다.');
      return;
    }

    setIsGenerating(true);

    try {
      const numericId = parseInt(id, 10);

      // Define the labels array here
      const labels = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];

      // Construct the payload
      const payload = {
        answer_summary: answerBlocks.map(block => ({
          review: block.summaryTitle,
          sections: block.answerOptions
            .filter(opt => opt.trim() !== '')
            .map((opt, index) => ({
              title: labels[index] || '',  // use labels based on the index
              text: opt
            }))
        }))
      };

      console.log('보내는 payload:', JSON.stringify(payload, null, 2));
      // 답변 요지 저장
      await saveReplySummary(numericId, payload);

      // 2) 답변 1회 생성 API 호출 (JWT 인증 필요)
      const replyResponse = await generateReply(numericId, payload);
      console.log('생성된 답변:', replyResponse.data);

      navigate(`/complaints/${id}/select-answer`, {
        state: { summaries: answerBlocks.map(block => block.summaryTitle) },
      });
    } catch (error) {
      console.error('답변 요지 저장 실패:', error);
      alert('답변 요지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
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
