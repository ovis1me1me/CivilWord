import React from 'react';

interface SimilarAnswersBlockProps {
  index: number;
  similarAnswers: { title: string; summary: string; content: any }[]; // content 타입을 any로 확장
  // containerHeight?: number; // 이 부분을 제거합니다.
}

export default function SimilarAnswersBlock({ index, similarAnswers /*, containerHeight*/ }: SimilarAnswersBlockProps) {
  console.log('SimilarAnswersBlock - similarAnswers prop:', similarAnswers);
  console.log('SimilarAnswersBlock - similarAnswers length:', similarAnswers?.length);

  // 유사 민원이 없을 경우 메시지 표시
  if (!similarAnswers || similarAnswers.length === 0) {
    return (
      <div className="space-y-4 w-full">
        {/* 제목: 박스 바깥 */}
        <div className="text-xl font-semibold text-black mb-2">
          <span>유사 민원</span>
        </div>
        {/* 회색 박스: 내용만 감쌈 */}
        <div
          className="bg-zinc-200 border rounded p-4 w-full flex items-center justify-center text-gray-600"
          // style={{ minHeight: containerHeight || 'auto' }} // 이 부분을 제거합니다.
        >
          유사 민원이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* 제목: 박스 바깥 */}
      <div className="text-xl font-semibold text-black mb-2">
        <span>유사 민원</span>
      </div>

      {/* 회색 박스: 내용만 감쌈 */}
      {/* 이 div는 이제 각 유사 민원 항목을 감싸는 역할이 아니라, 실제 내용이 렌더링되는 곳입니다. */}
      {/* 이 부분의 `bg-white` 클래스는 `bg-zinc-300`이 아니라 `SimilarAnswersBlock`의 부모 요소에 적용됩니다. */}
      {similarAnswers.map((answerItem, itemIndex) => {
        let sectionCounter = 1; // 각 유사 민원 답변 내용마다 섹션 번호 초기화
        return (
          <div
            key={itemIndex}
            className="bg-white border rounded p-4 mb-4 shadow-sm" // 이 부분이 각 답변 항목의 스타일을 정의합니다.
          >
            {/* 1. 민원 요지 */}
            <div className="mb-3">
              <span className="font-semibold text-gray-700 block mb-1">민원 요지:</span>
              <p className="text-gray-600 pl-4 text-sm break-words">
                {typeof answerItem.summary === 'object' ? JSON.stringify(answerItem.summary) : answerItem.summary}
              </p>
            </div>

            {/* 2. 답변 내용 */}
            <div>
              <span className="font-semibold text-gray-700 block mb-2">답변 내용:</span>
              {/* answerItem.content가 객체 형태일 경우 계층적으로 렌더링 */}
              {typeof answerItem.content === 'object' && answerItem.content !== null ? (
                <>
                  {/* 헤더 */}
                  <p className="whitespace-pre-line text-gray-800 pl-4">
                    <span className="font-semibold">{sectionCounter++}. </span> {answerItem.content.header || '없음'}
                  </p>
                  {/* 요약 */}
                  <p className="whitespace-pre-line text-gray-800 mt-2 pl-4">
                    <span className="font-semibold">{sectionCounter++}. </span> {answerItem.content.summary || '없음'}
                  </p>

                  {/* 본문 (body) 내용 렌더링 */}
                  {Array.isArray(answerItem.content.body) && answerItem.content.body.length > 0 ? (
                    answerItem.content.body.map((bodyItem, bodyIndex) => {
                      const currentSectionNumber = sectionCounter++;
                      return (
                        <div key={bodyIndex} className="whitespace-pre-line text-gray-800 mt-2 pl-4">
                          <span className="font-semibold">{currentSectionNumber}. </span>
                          {/* bodyItem.index (본문 소제목) 렌더링 */}
                          {bodyItem.index && (
                            <p className="inline-block font-bold">
                              {bodyItem.index}
                            </p>
                          )}
                          {/* bodyItem.section (실제 본문 내용) 렌더링 */}
                          {Array.isArray(bodyItem.section) && bodyItem.section.length > 0 ? (
                            bodyItem.section.map((sectionItem, sectionIndex) => (
                              <p key={`${bodyIndex}-${sectionIndex}`} className="ml-8">
                                {sectionItem.title ? `${sectionItem.title}. ` : ''}
                                {sectionItem.text}
                              </p>
                            ))
                          ) : (
                            <p className="ml-8">내용이 없습니다.</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    // body가 배열이 아니거나 비어있을 경우 (단순 문자열 등)
                    <p className="whitespace-pre-line text-gray-800 mt-2 pl-4">
                      <span className="font-semibold">{sectionCounter++}. </span>
                      {(answerItem.content?.body ? String(answerItem.content.body) : '본문이 없습니다.')}
                    </p>
                  )}

                  {/* 푸터 */}
                  <p className="whitespace-pre-line text-gray-800 mt-2 pl-4">
                    <span className="font-semibold">{sectionCounter++}. </span> {answerItem.content.footer || '없음'}
                  </p>
                </>
              ) : (
                // content가 객체가 아닐 경우 (기존처럼 문자열로 출력)
                <p className="text-gray-600 pl-4 text-sm break-words">
                  {typeof answerItem.content === 'object' ? JSON.stringify(answerItem.content) : answerItem.content}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}