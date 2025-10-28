import { ReactNode } from "react";
import ContentCenter from "./ContentCenter";

type Props = {
  title: string;
  icon?: ReactNode;
  hasSidebar?: boolean;
  className?: string; // 필요 시 추가 클래스
  maxWidthClass?: string;
};

export default function PageHeader({ title, icon, hasSidebar = true, className = "", maxWidthClass }: Props) {
  return (
    <div className={`w-full bg-gradient-to-r from-gov-950 via-gov-800 to-gov-700 shadow-md py-6 mb-6 ${className}`}>
      <ContentCenter hasSidebar={hasSidebar} maxWidthClass={maxWidthClass}>
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
        </div>
      </ContentCenter>
    </div>
  );
}
