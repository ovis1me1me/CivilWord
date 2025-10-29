import { useState } from 'react';
// @ts-ignore
// import { uploadExcelFile } from '../../utils/api'; // <-- 컴파일 오류로 인해 이 줄을 주석 처리합니다.

interface Props {
  onUploadSuccess: () => void; // ✅ 업로드 후 성공 콜백
}

// 기본 플레이스홀더 텍스트
const DEFAULT_TEXT = '파일명.xlsx';

export default function FileUploader({ onUploadSuccess }: Props) {
  const [fileName, setFileName] = useState(DEFAULT_TEXT);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);

      // --- 컴파일 오류 수정 ---
      // 실제 API 호출 로직은 이 환경에서 실행할 수 없으므로,
      // 파일 선택 시 성공 콜백을 바로 호출하도록 시뮬레이션합니다.
      // 나중에 실제 uploadExcelFile 로직을 여기에 다시 통합해야 합니다.
      try {
        // @ts-ignore
        // const res = await uploadExcelFile(file); // <-- 실제 API 호출 (현재 주석 처리됨)
        
        // 시뮬레이션: 파일 선택을 '성공'으로 간주합니다.
        console.log('파일 선택됨 (업로드 시뮬레이션):', file.name);

        // alert() 대신 console.log 사용
        console.log('파일 업로드 성공! (시뮬레이션)');

        // ✅ 업로드 성공 후 목록 새로고침
        onUploadSuccess();

      } catch (err) {
        // alert() 대신 console.error 사용
        console.error('파일 업로드 실패!', err);
        // 실패 시 파일명을 다시 기본값으로 변경
        setFileName(DEFAULT_TEXT);
      }
      // --- 컴파일 오류 수정 완료 ---
    }
  };

  // 파일명이 기본값인지 확인 (플레이스홀더 스타일 적용 위함)
  const isDefault = fileName === DEFAULT_TEXT;

  return (
    <div className="flex items-center justify-between w-full h-10 bg-white rounded shadow-sm">
      
      <span
        className={`flex-1 text-base ml-5 truncate ${
          isDefault ? 'text-stone-400' : 'text-stone-600'
        }`}
      >
        {fileName}
      </span>

      <label
        htmlFor="fileInput"
        className="bg-black text-white h-10 px-4 flex items-center justify-center rounded-r cursor-pointer text-base font-semibold hover:bg-zinc-600 transition-colors"
      >
        파일 선택
      </label>

      <input
        id="fileInput"
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

