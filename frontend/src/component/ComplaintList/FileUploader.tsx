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
    <div className="flex items-center bg-gray-100 rounded-lg h-10 mt-4">
      <div className="flex justify-between w-full">
        <span className="flex-1 text-black text-base font-medium ml-5 mt-2">{fileName}</span>
        <label
          htmlFor="fileInput"
          className="bg-black text-white h-10 px-3 pt-2 rounded-lg cursor-pointer text-base font-semibold hover:bg-zinc-600 transition"
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
    </div>
  );
}
