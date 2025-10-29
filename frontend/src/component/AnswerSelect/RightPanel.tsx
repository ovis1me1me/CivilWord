import AnswerBlock from '../ComplaintDetail/AnswerBlock'; // AnswerBlock의 실제 경로로 수정해주세요.

// ... (Interface 정의는 변경 없음)
interface AnswerSection {
  title: string;
  text: string;
}
interface AnswerSummaryBlock {
  index: string;
  section: AnswerSection[];
}
interface Props {
  summary: string;
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
    <div className="flex-1 flex flex-col bg-white rounded relative">
      {/* ✅ (수정) text-black -> text-slate-800 */}
      <h3 className="text-xl font-semibold text-slate-800 mb-4">민원 요지</h3>
      {/* ✅ (수정) bg-gray-200 -> bg-slate-50, border 추가, 텍스트 색상 변경 */}
      <div className="bg-slate-50 border border-slate-200 p-4 mb-2 rounded-lg h-28 overflow-auto text-slate-700">
        {summary}
      </div>
      
      {/* AnswerBlock 컴포넌트는 이미 이전 요청에서 slate 테마로 수정되었습니다. */}
      <div className="overflow-auto pr-2 max-h-[300px] mt-2">
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
      
      {/* ✅ (수정) 버튼 색상을 slate 테마로 변경 */}
      <button
        onClick={onRegenerate}
        disabled={isGenerating}
        className={`mt-4 w-full px-4 py-2 text-sm font-semibold rounded-lg transition
          ${
            isGenerating
              ? 'bg-slate-400 cursor-not-allowed' // Disabled
              : 'bg-gradient-to-r from-gov-950 via-gov-800 to-gov-700 hover:opacity-90' // Enabled
          } text-white`}
      >
        {isGenerating ? '재생성 중...' : '답변 재생성'}
      </button>
    </div>
  );
}