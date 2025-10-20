import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default function EmptyPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
      {/* 아이콘 */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
        <AlertTriangle className="w-10 h-10 text-slate-500" />
      </div>

      {/* 메시지 */}
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        잘못된 접근입니다.
      </h2>
      <p className="text-slate-500 mb-8">
        요청하신 페이지를 찾을 수 없습니다. <br />
        주소를 다시 확인하거나 아래 버튼을 눌러 이동하세요.
      </p>

      {/* 버튼 영역 */}
      <div className="flex gap-4">
        {/* 민원 목록으로 */}
        <Link
          to="/complaints"
          className="px-6 py-3 rounded-lg font-semibold text-white bg-[#1b2b52] hover:bg-[#22386b] transition-colors shadow-sm"
        >
          민원 목록으로 돌아가기
        </Link>

        {/* 로그인 페이지로 */}
        <Link
          to="/Login"
          className="px-6 py-3 rounded-lg font-semibold text-[#1b2b52] border border-[#1b2b52] hover:bg-[#1b2b52] hover:text-white transition-colors shadow-sm"
        >
          로그인하러 가기
        </Link>
      </div>
    </div>
  );
}
