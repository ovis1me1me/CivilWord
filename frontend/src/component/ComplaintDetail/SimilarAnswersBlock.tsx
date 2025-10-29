import React from 'react';

// Props 정의
interface SimilarAnswersBlockProps {
  index: number;
  similarAnswers: { title: string; summary: string; content: string }[];
  containerHeight?: number;
  onSelect?: (payload: { summaryTitle: string; answerOptions: string[] }) => void;
}

export default function SimilarAnswersBlock({
  index,
  similarAnswers,
  containerHeight, // 이 Prop은 현재 코드에서 사용되지 않지만 정의는 유지합니다.
  onSelect,
}: SimilarAnswersBlockProps) {
  
  // 1. 유사 민원이 없을 경우의 렌더링
  if (!similarAnswers || similarAnswers.length === 0) {
    return (
      <div className="space-y-4">
        {/* 제목 */}
        <div className="text-xl font-semibold text-slate-800 mb-2">
          <span>유사 민원</span>
        </div>
        {/* "없음" 메시지 박스 */}
        <div
          className="bg-slate-50 border border-slate-200 rounded p-4 w-full flex items-center justify-center text-slate-500 h-32"
        >
          유사 민원이 없습니다.
        </div>
      </div>
    );
  }

  // 2. 유사 민원이 있을 경우의 렌더링
  return (
    <div className="space-y-4">
      {/* 제목 */}
      <div className="text-xl font-semibold text-slate-800 mb-2">
        <span>유사 민원</span>
      </div>

      {/* 전체 컨테이너 (스크롤) */}
      <div
        className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4 w-full sticky top-36 max-h-[500px] overflow-y-auto"
      >
        {/* 스크롤 내부의 고정 영역 (이 부분은 sticky가 중첩되어 의도와 다르게 동작할 수 있으니 확인이 필요할 수 있습니다) */}
        <div className="sticky top-24 self-start w-full max-w-md">
          
          {/* 유사 민원 아이템 반복 */}
          {similarAnswers.map((answerItem, itemIndex) => {
            
            // --- 데이터 파싱 로직 시작 ---
            let parsedContent: any = null;
            try {
              parsedContent =
                typeof answerItem.content === 'string'
                  ? JSON.parse(answerItem.content)
                  : answerItem.content;
            } catch (e) {
              console.error(
                'Failed to parse answerItem.content for item:',
                answerItem.title,
                e,
                answerItem.content
              );
            }
            
            const bodySections =
              parsedContent?.body && Array.isArray(parsedContent.body)
                ? parsedContent.body
                : [];
                
            const firstBody = bodySections?.[0];
            
            const summaryTitle =
              typeof firstBody?.index === 'string' && firstBody.index.trim()
                ? firstBody.index.trim()
                : typeof answerItem.summary === 'string'
                  ? answerItem.summary
                  : JSON.stringify(answerItem.summary);
                  
            const answerOptions: string[] =
              Array.isArray(firstBody?.section)
                ? firstBody.section
                    .map((s: any) =>
                      typeof s?.text === 'string' ? s.text.trim() : ''
                    )
                    .filter((t: string) => t.length > 0)
                : typeof answerItem.content === 'string' &&
                    answerItem.content.trim()
                  ? [answerItem.content.trim()]
                  : [];
            // --- 데이터 파싱 로직 끝 ---

            return (
              <div
                key={itemIndex}
                className="relative grid bg-white border border-slate-300 rounded-lg p-4 mb-4"
              >
                {/* 1. 민원 요지 */}
                {/* ✅ pr-16 추가: 버튼 공간 확보 */}
                <div className="flex flex-col mb-3 pr-16">
                  <span className="font-bold text-slate-700 mb-1">
                    민원 요지 :
                  </span>
                  <p className="text-slate-700 pl-4">
                    {typeof answerItem.summary === 'object'
                      ? JSON.stringify(answerItem.summary)
                      : answerItem.summary}
                  </p>
                </div>

                {/* 2. 답변 내용 */}
                {/* ✅ pr-16 추가: 버튼 공간 확보 */}
                <div className="flex flex-col pr-16">
                  <span className="font-bold text-slate-700 mb-2">
                    답변 내용 :
                  </span>
                  {Array.isArray(bodySections) && bodySections.length > 0 ? (
                    bodySections.map((b, bodyIndex) => (
                      <React.Fragment key={bodyIndex}>
                        <div className="font-semibold text-slate-800 mb-1 pl-2">
                          {bodyIndex + 1}. {b.index}
                        </div>
                        {Array.isArray(b.section) && b.section.length > 0 ? (
                          b.section.map((sub: any, subIndex: number) => (
                            <div
                              key={`${bodyIndex}-${subIndex}`}
                              className="flex items-start gap-2 ml-6 text-slate-700"
                            >
                              <span className="font-bold">{'•'}</span>
                              <span>{sub?.text}</span>
                            </div>
                          ))
                        ) : (
                          <div className="ml-6 text-slate-500">내용 없음</div>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <p className="text-slate-700 pl-4">
                      {typeof answerItem.content === 'object'
                        ? JSON.stringify(answerItem.content)
                        : answerItem.content}
                    </p>
                  )}
                </div>

                {/* 3. 답변 선택 버튼 */}
                <div className="absolute top-1/2 right-2 -translate-y-1/2">
                  <button
                    type="button"
                    onClick={() => onSelect?.({ summaryTitle, answerOptions })}
                    className="px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 transition"
                    title="이 유사 민원의 요지를 답변 요지에 채워 넣합니다"
                  >
                    답변
                    <br />
                    선택
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