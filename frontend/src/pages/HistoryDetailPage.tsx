import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchHistoryDetail } from '../utils/api';

interface ReplyContent {
  header: string;
  summary: string;
  // body 타입 정의:
  // body는 { index: string, section: Array<{ text: string, title: string }> } 형태의 객체 배열이거나,
  // 단순 문자열이거나, null일 수 있음.
  body: Array<{ index: string; section: Array<{ text: string; title: string }> }> | string | null;
  footer: string;
}

interface ComplaintDetail {
  title: string;
  content: string;
  reply_content: ReplyContent | null;
}

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);

  useEffect(() => {
    const loadComplaint = async () => {
      try {
        const res = await fetchHistoryDetail(Number(id));
        console.log(res.data);
        setComplaint(res.data);
      } catch (err) {
        console.error('히스토리 상세 불러오기 실패', err);
      }
    };
    loadComplaint();
  }, [id]);

  if (!complaint) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // 본문 index에 사용할 한글 자모 (가, 나, 다...) 배열 - 이제 사용하지 않음
  // const koreanAlphabet = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];

  let mainSectionCounter = 1; // 메인 섹션 번호를 위한 카운터

  return (
    <div className="ml-[250px] p-8">
      <div className="max-w-screen-lg mx-auto bg-white rounded-lg p-6 space-y-6">
        {/* 민원 제목 */}
        <h1 className="text-2xl font-bold underline underline-offset-4">{complaint.title}</h1>

        {/* 민원 내용 */}
        <div>
          <h2 className="text-lg font-semibold mb-2">민원 내용</h2>
          <div className="bg-gray-200 p-6 rounded-lg h-64 overflow-y-auto">
            <p className="whitespace-pre-line">
              {complaint.content}
            </p>
          </div>
        </div>

        {/* 답변 내용 */}
        <div>
          <h2 className="text-lg font-semibold mb-2">저장된 답변</h2>
          <div className="bg-gray-200 p-6 rounded-lg h-auto overflow-y-auto">
            {complaint.reply_content ? (
              <>
                {/* 헤더 */}
                <p className="whitespace-pre-line">
                  <span className="font-semibold">{mainSectionCounter++}. </span> {complaint.reply_content.header || '없음'}
                </p>
                {/* 요약 */}
                <p className="whitespace-pre-line mt-2">
                  <span className="font-semibold">{mainSectionCounter++}. </span> {complaint.reply_content.summary || '없음'}
                </p>

                {/* 본문 (body) 내용 렌더링 */}
                {Array.isArray(complaint.reply_content.body) && complaint.reply_content.body.length > 0 ? (
                  complaint.reply_content.body.map((bodyItem, bodyIndex) => {
                    // body의 각 index 항목마다 mainSectionCounter 증가
                    const currentSectionNumber = mainSectionCounter++; 
                    return (
                      <div key={bodyIndex} className="whitespace-pre-line mt-2">
                        <span className="font-semibold">{currentSectionNumber}. </span> 
                        {/* bodyItem.index (본문 소제목) 렌더링 */}
                        {bodyItem.index && (
                          <p className="inline-block font-bold"> {/* inline-block으로 같은 줄에 표시 */}
                            {bodyItem.index}
                          </p>
                        )}
                        {/* bodyItem.section (실제 본문 내용) 렌더링 */}
                        {Array.isArray(bodyItem.section) && bodyItem.section.length > 0 ? (
                          bodyItem.section.map((sectionItem, sectionIndex) => (
                            <p key={`${bodyIndex}-${sectionIndex}`} className="ml-8">
                              {/* sectionItem.title이 있다면 함께 렌더링 */}
                              {sectionItem.title ? `${sectionItem.title}. ` : ''}
                              {sectionItem.text}
                            </p>
                          ))
                        ) : (
                          // section이 배열이 아니거나 비어있을 경우
                          <p className="ml-8">내용이 없습니다.</p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  // body가 배열이 아니거나 비어있을 경우 (단순 문자열 등)
                  <p className="whitespace-pre-line mt-2">
                    <span className="font-semibold">{mainSectionCounter++}. </span>
                    {(complaint.reply_content?.body ? String(complaint.reply_content.body) : '본문이 없습니다.')}
                  </p>
                )}

                {/* 푸터 */}
                <p className="whitespace-pre-line mt-2">
                  <span className="font-semibold">{mainSectionCounter++}. </span> {complaint.reply_content.footer || '없음'}
                </p>
              </>
            ) : (
              <p className="whitespace-pre-line">답변이 없습니다.</p>
            )}
          </div>
        </div>

        {/* 목록으로 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/complaints/history')}
            className="bg-black text-white text-md font-semibold px-6 py-2 rounded-lg hover:bg-zinc-600 transition"
          >
            목록으로
          </button>
        </div>
      </div>
    </div>
  );
}