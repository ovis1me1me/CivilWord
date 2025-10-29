import React from 'react';

interface SimilarAnswersBlockProps {
  index: number;
  similarAnswers: { title: string; summary: string; content: any }[];
}

// ✅ (추가) bodyItem의 타입을 정의합니다.
interface BodyItem {
  index?: string;
  section?: SectionItem[]; // SectionItem 타입을 사용합니다.
}

// ✅ (추가) sectionItem의 타입을 정의합니다.
interface SectionItem {
  title?: string;
  text: string;
}

export default function SimilarAnswersBlock({
  index,
  similarAnswers,
}: SimilarAnswersBlockProps) {
  // 유사 민원이 없을 경우
  if (!similarAnswers || similarAnswers.length === 0) {
    return (
      <div className="space-y-4 w-full">
        {/* ✅ (수정) text-slate-800 적용 */}
        <div className="text-xl font-semibold text-slate-800 mb-2">
          <span>유사 민원</span>
        </div>
        {/* ✅ (수정) bg-slate-50, border, text-slate-500 적용 */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 w-full flex items-center justify-center text-slate-500">
          유사 민원이 없습니다.
        </div>
      </div>
    );
  }

  // 유사 민원이 있을 경우
  return (
    <div className="space-y-4 w-full p-4">
      {/* ✅ (수정) text-slate-800 적용 */}
      <div className="text-xl font-semibold text-slate-800 mb-2">
        <span>유사 민원</span>
      </div>

      {similarAnswers.map((answerItem, itemIndex) => {
        let sectionCounter = 1;
        return (
          <div
            key={itemIndex}
            // ✅ (수정) border-slate-300 적용
            className="bg-white border border-slate-300 rounded-lg p-4 mb-4 shadow-sm"
          >
            {/* 1. 민원 요지 */}
            <div className="mb-3">
              {/* ✅ (수정) text-slate-700 적용 */}
              <span className="font-semibold block mb-1 text-slate-700">
                민원 요지:
              </span>
              {/* ✅ (수정) text-slate-700 적용 */}
              <p className=" pl-4 text-md break-words text-slate-700">
                {typeof answerItem.summary === 'object'
                  ? JSON.stringify(answerItem.summary)
                  : answerItem.summary}
              </p>
            </div>

            {/* 2. 답변 내용 */}
            <div>
              {/* ✅ (수정) text-slate-700 적용 */}
              <span className="font-semibold block mb-2 text-slate-700">
                답변 내용:
              </span>
              {typeof answerItem.content === 'object' &&
              answerItem.content !== null ? (
                // ✅ (수정) 텍스트 색상 slate로 변경
                <div className="text-slate-700">
                  <p className="whitespace-pre-line pl-4">
                    <span className="font-semibold">{sectionCounter++}. </span>{' '}
                    {answerItem.content.header || '없음'}
                  </p>
                  <p className="whitespace-pre-line mt-2 pl-4">
                    <span className="font-semibold">{sectionCounter++}. </span>{' '}
                    {answerItem.content.summary || '없음'}
                  </p>

                  {Array.isArray(answerItem.content.body) &&
                  answerItem.content.body.length > 0 ? (
                    // ✅ (수정) 타입 명시
                    answerItem.content.body.map(
                      (bodyItem: BodyItem, bodyIndex: number) => {
                        const currentSectionNumber = sectionCounter++;
                        return (
                          <div
                            key={bodyIndex}
                            className="whitespace-pre-line mt-2 pl-4"
                          >
                            <span className="font-semibold">
                              {currentSectionNumber}.{' '}
                            </span>
                            {bodyItem.index && (
                              // ✅ (수정) text-slate-800 (더 진하게)
                              <p className="inline-block font-bold text-slate-800">
                                {bodyItem.index}
                              </p>
                            )}
                            {Array.isArray(bodyItem.section) &&
                            bodyItem.section.length > 0 ? (
                              // ✅ (수정) 타입 명시
                              bodyItem.section.map(
                                (
                                  sectionItem: SectionItem,
                                  sectionIndex: number
                                ) => (
                                  <p
                                    key={`${bodyIndex}-${sectionIndex}`}
                                    className="ml-8"
                                  >
                                    {sectionItem.title
                                      ? `${sectionItem.title} `
                                      : ''}
                                    {sectionItem.text}
                                  </p>
                                )
                              )
                            ) : (
                              // ✅ (수정) text-slate-500 적용
                              <p className="ml-8 text-slate-500">
                                내용이 없습니다.
                              </p>
                            )}
                          </div>
                        );
                      }
                    )
                  ) : (
                    <p className="whitespace-pre-line mt-2 pl-4">
                      <span className="font-semibold">{sectionCounter++}. </span>
                      {answerItem.content?.body
                        ? String(answerItem.content.body)
                        : '본문이 없습니다.'}
                    </p>
                  )}

                  <p className="whitespace-pre-line mt-2 pl-4">
                    <span className="font-semibold">{sectionCounter++}. </span>{' '}
                    {answerItem.content.footer || '없음'}
                  </p>
                </div>
              ) : (
                <p className="pl-4 text-md break-words text-slate-700">
                  {typeof answerItem.content === 'object'
                    ? JSON.stringify(answerItem.content)
                    : answerItem.content}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}