interface SimilarAnswersBlockProps {
  index: number;
  similarAnswers: string[][];
  containerHeight?: number;
}

const labels = ['가', '나', '다', '라', '마', '바', '사'];

export default function SimilarAnswersBlock({ index, similarAnswers, containerHeight }: SimilarAnswersBlockProps) {
  return (
    <div className="space-y-4">
        {/* 제목: 박스 바깥 */}
        <div className="text-xl font-semibold text-black mb-2">
            <span>유사 민원{index > 0 ? `_${index + 1}` : ''}</span>
        </div>

        {/* 회색 박스: 내용만 감쌈 */}
        <div
            className="bg-gray-200 border rounded p-4 space-y-4 w-full sticky top-36 max-h-[500px] overflow-y-auto"
            // style={{ minHeight: containerHeight || 50 }}
        >
            <div className="sticky top-24 self-start w-full max-w-md">
            {similarAnswers.map((answerGroup, groupIndex) => (
                <div
                key={groupIndex}
                className="grid bg-gray-100 border rounded p-4 mb-4"
                >
                {answerGroup.map((answer, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                    <span className="font-bold">{labels[i] || '•'}.</span>
                    <span>{answer}</span>
                    </div>
                ))}
                </div>
            ))}
            </div>
        </div>
    </div>
    );
}
