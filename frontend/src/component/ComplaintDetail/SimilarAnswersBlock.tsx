import React from 'react';

interface SimilarAnswersBlockProps {
  index: number;
  similarAnswers: { title: string; summary: string; content: string }[];
  containerHeight?: number;
  onSelect?: (payload: { summaryTitle: string; answerOptions: string[] }) => void;
}

const labels = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하']; // 한글 라벨

export default function SimilarAnswersBlock({ index, similarAnswers, containerHeight, onSelect }: SimilarAnswersBlockProps) {
  // 유사 민원이 없을 경우 메시지 표시
  if (!similarAnswers || similarAnswers.length === 0) {
    return (
      <div className="space-y-4">
        {/* 제목: 박스 바깥 */}
        <div className="text-xl font-semibold text-black mb-2">
          <span>유사 민원</span>
        </div>
        {/* 회색 박스: 내용만 감쌈 */}
        <div
          className="bg-gray-200 border rounded p-4 w-full flex items-center justify-center text-gray-600 h-32" // 높이를 고정하여 메시지가 중앙에 오도록 함
          // style={{ minHeight: containerHeight || 50 }} // 기존 스타일 유지 (필요 시)
        >
          유사 민원이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 제목: 박스 바깥 */}
      <div className="text-xl font-semibold text-black mb-2">
        <span>유사 민원</span>
      </div>

      {/* 회색 박스: 내용만 감쌈 */}
      <div
        className="bg-gray-200 border rounded-lg p-4 space-y-4 w-full sticky top-36 max-h-[500px] overflow-y-auto"
        // style={{ minHeight: containerHeight || 50 }}
      >
        <div className="sticky top-24 self-start w-full max-w-md">
          {similarAnswers.map((answerItem, itemIndex) => {
            let parsedContent: any = null;
            try {
              parsedContent = typeof answerItem.content === 'string'
                ? JSON.parse(answerItem.content)
                : answerItem.content;
            } catch (e) {
              console.error("Failed to parse answerItem.content for item:", answerItem.title, e, answerItem.content);
            }

            const bodySections = parsedContent?.body && Array.isArray(parsedContent.body)
              ? parsedContent.body
              : [];
            const firstBody = bodySections?.[0];

            const summaryTitle = 
              typeof firstBody?.index === 'string' && firstBody.index.trim()
                ? firstBody.index.trim()
                : // fallback (없을 때만)
                  (typeof answerItem.summary === 'string'
                    ? answerItem.summary
                    : JSON.stringify(answerItem.summary));

            // 규칙:
            // - body[0]?.section 안의 항목들을 '가/나/다...' 순서대로 answerOptions로 매핑
            // - 없으면 content 문자열 하나로 대체
            const answerOptions: string[] =
              Array.isArray(firstBody?.section)
                ? firstBody.section
                    .map((s: any) => (typeof s?.text === 'string' ? s.text.trim() : ''))
                    .filter((t: string) => t.length > 0)
                : (typeof answerItem.content === 'string' && answerItem.content.trim()
                    ? [answerItem.content.trim()]
                    : []);

            return (
              <div
                key={itemIndex}
                className="grid bg-gray-100 border rounded-lg p-4 mb-4"
              >
                {/* 1. 민원 요지 */}
                <div className="flex flex-col mb-3"> {/* flex-col로 변경하여 레이블과 내용 분리 */}
                  <span className="font-bold text-gray-700 mb-1">민원 요지 :</span>
                  <p className="text-gray-600 pl-4"> {/* 들여쓰기 위해 pl-4 추가 */}
                    {typeof answerItem.summary === 'object' ? JSON.stringify(answerItem.summary) : answerItem.summary}
                  </p>
                </div>

                {/* 2. 답변 내용 */}
                <div className="flex flex-col">
                  <span className="font-bold text-gray-700 mb-2">답변 내용 :</span>
                  {Array.isArray(bodySections) && bodySections.length > 0 ? (
                    bodySections.map((b, bodyIndex) => (
                      <React.Fragment key={bodyIndex}>
                        <div className="font-semibold text-gray-800 mb-1 pl-2">
                          {bodyIndex + 1}. {b.index}
                        </div>
                        {Array.isArray(b.section) && b.section.length > 0 ? (
                          b.section.map((sub: any, subIndex: number) => (
                            <div key={`${bodyIndex}-${subIndex}`} className="flex items-start gap-2 ml-6 text-gray-600">
                              <span className="font-bold">{labels[subIndex] || '•'}.</span>
                              <span>{sub?.text}</span>
                            </div>
                          ))
                        ) : (
                          <div className="ml-6 text-gray-600">내용 없음</div>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <p className="text-gray-600 pl-4">
                      {typeof answerItem.content === 'object'
                        ? JSON.stringify(answerItem.content)
                        : answerItem.content}
                    </p>
                  )}
                </div>

                {/* ✅ 답변 선택 버튼 */}
                <div className="absolute top-1/2 right-2 -translate-y-1/2">
                  <button
                    type="button"
                    onClick={() => onSelect?.({ summaryTitle, answerOptions })}
                    className="px-3 py-1.5 rounded-full text-sm font-semibold bg-black text-white hover:bg-zinc-700 transition"
                    title="이 유사 민원의 요지를 답변 요지에 채워 넣습니다"
                  >
                    답변<br/>선택
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}