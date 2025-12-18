import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  hasSidebar?: boolean;                // 사이드바가 보이면 true
  maxWidthClass?: string;              // 컨텐츠 최대 폭 (필요 시 조절)
};

export default function ContentCenter({
  children,
  hasSidebar = true,
  maxWidthClass = "max-w-[850px]",     // 검색창/리스트 폭 통일
}: Props) {
  return (
    <div className={hasSidebar ? "ml-[250px]" : ""}>
      <div className={`${maxWidthClass} w-full mx-auto px-4`}>
        {children}
      </div>
    </div>
  );
}
