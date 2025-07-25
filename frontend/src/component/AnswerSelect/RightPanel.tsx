import AnswerBlock from '../ComplaintDetail/AnswerBlock'; // AnswerBlock의 실제 경로로 수정해주세요.

// 부모로부터 받을 데이터와 함수의 타입을 정의합니다.
interface AnswerSection {
  title: string;
  text: string;
}

interface AnswerSummaryBlock {
  index: string;
  section: AnswerSection[];
}

interface Props {
  summary: string; // 민원 요지 (표시용)
  answerSummaryBlocks: AnswerSummaryBlock[];
  onReviewChange: (blockIndex: number, value: string) => void;
  onSectionChange: (blockIndex: number, sectionIndex: number, value: string) => void;
  onAddSection: (blockIndex: number) => void;
  onDeleteSection: (blockIndex: number, sectionIndex: number) => void;
  onAddBlock: () => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

export default function RightPanel({
  summary,
  answerSummaryBlocks,
  onReviewChange,
  onSectionChange,
  onAddSection,
  onDeleteSection,
  onAddBlock,
  onRegenerate,
  isGenerating,
}: Props) {
  return (
    <div className="flex-1 flex flex-col h-94 p-4 bg-white rounded relative">
      <h3 className="text-xl font-semibold text-black mb-2">민원 요지</h3>
      <div className="bg-zinc-300 p-2 mb-2 rounded h-28 overflow-auto">{summary}</div>
      <div className="overflow-auto pr-2 max-h-[300px]">
        {answerSummaryBlocks.map((block, index) => (
          <AnswerBlock
            key={index}
            index={index}
            summaryTitle={block.index}
            answerOptions={block.section.map(sec => sec.text)}
            onSummaryChange={(value) => onReviewChange(index, value)}
            onAnswerChange={(sectionIndex, value) => onSectionChange(index, sectionIndex, value)}
            onAddAnswer={() => onAddSection(index)}
            onDeleteAnswer={(sectionIndex) => onDeleteSection(index, sectionIndex)}
            onAddSummary={onAddBlock}
          />
        ))}
      </div>

       <button
        onClick={onRegenerate}
        disabled={isGenerating}
        className={`mt-4 w-full px-4 py-2 text-sm font-semibold rounded ${
          isGenerating ? 'bg-gray-400' : 'bg-black'
        } text-white`}
      >
        {isGenerating ? '재생성 중...' : '답변 재생성'}
      </button>
    </div>
  );
}
