import { ReactNode } from "react";
import ContentCenter from "./ContentCenter";

type Props = {
  title: string;
  icon?: ReactNode;
  hasSidebar?: boolean;
  className?: string; // 필요 시 추가 클래스
  maxWidthClass?: string;
  rightContent?: ReactNode; // ✅ (추가) 오른쪽에 추가할 컨텐츠
};

export default function PageHeader({ 
  title, 
  icon, 
  hasSidebar = true, 
  className = "", 
  maxWidthClass, 
  rightContent // ✅ (추가)
}: Props) {
  return (
    <div className={`w-full shadow-md py-6 mb-6 ${className}`}
          style={{
            background: 'linear-gradient(90deg, #0a2747 7%, #18497f 60%, #1f5b9a 100%)',
          }}
        >
      <ContentCenter hasSidebar={hasSidebar} maxWidthClass={maxWidthClass}>
        
        {/* ✅ (수정) flex, justify-between, items-center 추가 */}
        <div className="flex items-center justify-between">
          
          {/* 왼쪽 (아이콘 + 제목) */}
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
          </div>
          
          {/* ✅ (추가) 오른쪽 (버튼 등이 들어올 자리) */}
          <div>
            {rightContent}
          </div>

        </div>
      </ContentCenter>
    </div>
  );
}