import { useState } from 'react';
import { uploadExcelFile } from '../../utils/api';

interface Props {
  onUploadSuccess: () => void; // ✅ 업로드 후 성공 콜백
}

export default function FileUploader({ onUploadSuccess }: Props) {
  const [fileName, setFileName] = useState('파일명.xlsx');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);

      try {
        const res = await uploadExcelFile(file);
        alert('파일 업로드 성공!');
        console.log(res.data);

        // ✅ 업로드 성공 후 목록 새로고침
        onUploadSuccess();

      } catch (err) {
        console.error(err);
        alert('파일 업로드 실패!');
      }
    }
  };

  return (
    <div className="flex items-center justify-between bg-neutral-100 rounded w-full max-w-[917px] h-9 mx-auto mt-4 px-4">
      <span className="text-black text-base font-medium">{fileName}</span>
      <label
        htmlFor="fileInput"
        className="bg-black text-white px-3 py-1 rounded cursor-pointer text-base font-semibold hover:bg-gray-800 transition"
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
