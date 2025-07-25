import React from 'react';

interface SimilarAnswersBlockProps {
  index: number;
  similarAnswers: { title: string; summary: string; content: string }[];
  containerHeight?: number;
}

const labels = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하']; // 한글 라벨

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

            return (
              <div
                key={itemIndex}
                className="grid bg-gray-100 border rounded p-4 mb-4"
              >
                {/* 1. 민원의 제목 (이미지의 "상수도 누수", "가로수 가지치기 요청" 부분) */}
                <h3 className="font-bold text-xl mb-3 text-gray-800">{answerItem.title}</h3>

                {/* 2. 민원 요지 */}
                <div className="flex flex-col mb-3"> {/* flex-col로 변경하여 레이블과 내용 분리 */}
                  <span className="font-bold text-gray-700 mb-1">민원 요지 :</span>
                  <p className="text-gray-600 pl-4"> {/* 들여쓰기 위해 pl-4 추가 */}
                    {typeof answerItem.summary === 'object' ? JSON.stringify(answerItem.summary) : answerItem.summary}
                  </p>
                </div>

                {/* 3. 답변 내용 */}
                <div className="flex flex-col"> {/* flex-col 유지 */}
                  <span className="font-bold text-gray-700 mb-2">답변 내용 :</span> {/* 간격 조정 */}
                  
                  {bodySections.length > 0 ? (
                    bodySections.map((bodySectionItem, bodyIndex) => (
                      <React.Fragment key={bodyIndex}>
                        {/* 답변의 첫 번째 줄 (예: "1. 가로등 고장으로 ...") */}
                        {/* 글씨 굵기를 font-semibold로, 크기는 base(기본)로 조정하여 과도하게 크지 않게 */}
                        <div className="font-semibold text-gray-800 mb-1 pl-2"> {/* 약간의 들여쓰기 */}
                           {/* bodyIndex + 1은 항상 숫자이므로 .을 붙여줍니다. */}
                           <span>{bodyIndex + 1}. {bodySectionItem.index}</span>
                        </div>

                        {/* 실제 답변 내용 (예: "가. 귀하께서 신고하신...") */}
                        {bodySectionItem.section && Array.isArray(bodySectionItem.section) && bodySectionItem.section.length > 0 ? (
                            bodySectionItem.section.map((subSectionItem, subIndex) => (
                                <div key={`${bodyIndex}-${subIndex}`} className="flex items-start gap-2 ml-6 text-gray-600"> {/* 들여쓰기 더 깊게, 색상 조정 */}
                                    {/* '가.' 형태의 번호는 labels 배열에서 가져옵니다. */}
                                    <span className="font-bold">{labels[subIndex] || '•'}.</span>
                                    <span>{subSectionItem.text}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-start gap-2 ml-6 text-gray-600">
                                <span>{bodySectionItem.section ? JSON.stringify(bodySectionItem.section) : "내용 없음"}</span>
                            </div>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <p className="text-gray-600 pl-4">{typeof answerItem.content === 'object' ? JSON.stringify(answerItem.content) : answerItem.content}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}