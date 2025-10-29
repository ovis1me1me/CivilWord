import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchHistoryDetail } from '../utils/api';

import PageHeader from '../component/Common/PageHeader';
import ContentCenter from '../component/Common/ContentCenter';
import { FileText } from 'lucide-react';
import Spinner from '../component/Shared/Spinner';

interface ReplyContent {
  header: string;
  summary: string;
  body:
    | Array<{ index: string; section: Array<{ text: string; title: string }> }>
    | string
    | null;
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
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Spinner />
      </div>
    );
  }

  const backButton = (
    <button
      onClick={() => navigate('/complaints/history')}
      className="bg-white text-slate-700 border border-slate-300 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
    >
      목록으로
    </button>
  );

  let mainSectionCounter = 1;

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <PageHeader
        title={complaint.title}
        icon={<FileText size={30} className="text-white drop-shadow-md" />}
        hasSidebar={true}
        maxWidthClass="max-w-[1000px]"
        rightContent={backButton}
      />

      <ContentCenter hasSidebar={true} maxWidthClass="max-w-[1000px]">
        {/* ✅ (수정) 그림자 효과 강화 (shadow-xl shadow-slate-300) */}
        <div className="bg-white p-6 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.1)] w-full space-y-6 relative mt-8">
          
          {/* 민원 내용 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              민원 내용
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[10rem] overflow-y-auto">
              <p className="whitespace-pre-line text-slate-700">
                {complaint.content}
              </p>
            </div>
          </div>

          {/* 답변 내용 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              저장된 답변
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 h-auto overflow-y-auto text-slate-700">
              {complaint.reply_content ? (
                <>
                  <p className="whitespace-pre-line">
                    <span className="font-semibold text-slate-800">
                      {mainSectionCounter++}.{' '}
                    </span>{' '}
                    {complaint.reply_content.header || (
                      <span className="text-slate-500">'없음'</span>
                    )}
                  </p>
                  <p className="whitespace-pre-line mt-2">
                    <span className="font-semibold text-slate-800">
                      {mainSectionCounter++}.{' '}
                    </span>{' '}
                    {complaint.reply_content.summary || (
                      <span className="text-slate-500">'없음'</span>
                    )}
                  </p>
                  {Array.isArray(complaint.reply_content.body) &&
                  complaint.reply_content.body.length > 0 ? (
                    complaint.reply_content.body.map((bodyItem, bodyIndex) => {
                      const currentSectionNumber = mainSectionCounter++;
                      return (
                        <div
                          key={bodyIndex}
                          className="whitespace-pre-line mt-2"
                        >
                          <span className="font-semibold text-slate-800">
                            {currentSectionNumber}.{' '}
                          </span>
                          {bodyItem.index && (
                            <p className="inline-block font-bold text-slate-800">
                              {bodyItem.index}
                            </p>
                          )}
                          {Array.isArray(bodyItem.section) &&
                          bodyItem.section.length > 0 ? (
                            bodyItem.section.map(
                              (sectionItem, sectionIndex) => (
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
                            <p className="ml-8 text-slate-500">
                              내용이 없습니다.
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="whitespace-pre-line mt-2">
                      <span className="font-semibold text-slate-800">
                        {mainSectionCounter++}.{' '}
                      </span>
                      {complaint.reply_content?.body ? (
                        String(complaint.reply_content.body)
                      ) : (
                        <span className="text-slate-500">'본문이 없습니다.'</span>
                      )}
                    </p>
                  )}
                  <p className="whitespace-pre-line mt-2">
                    <span className="font-semibold text-slate-800">
                      {mainSectionCounter++}.{' '}
                    </span>{' '}
                    {complaint.reply_content.footer || (
                      <span className="text-slate-500">'없음'</span>
                    )}
                  </p>
                </>
              ) : (
                <p className="whitespace-pre-line text-slate-500">
                  답변이 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </ContentCenter>
    </div>
  );
}