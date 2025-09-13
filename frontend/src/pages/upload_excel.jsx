import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './upload_excel.css';
import { file } from '../assets/icons';
import Spinner from '../component/Shared/Spinner';
import { uploadExcelFile } from '../utils/api';

function UploadExcel() {
  const [fileName, setFileName] = useState('');
  const [fileObj, setFileObj] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // ✅ 드래그 상태
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFileName(selectedFile.name);
      setFileObj(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFileName(droppedFile.name);
      setFileObj(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = async () => {
    if (!fileObj) {
      alert('파일을 선택해주세요.');
      return;
    }

    try {
      setIsGenerating(true);
      const response = await uploadExcelFile(fileObj);
      alert(response.data.message);
      navigate('/complaints');
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || '업로드 중 오류가 발생했습니다.';
      alert(`업로드 실패: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="excel-page-wrapper">
      <div className="excel-container">
        <h2 className="title">
          엑셀 파일 양식을 다운로드 후 양식에 맞게 작성하여 아래 박스에 업로드 해주세요.
        </h2>

        <a className="example-link" href="/excel-template.xlsx" download>
          <img src={file} alt="파일 아이콘" />
          <span> Excel 양식.xlsx</span>
        </a>

        {/* ✅ 드래그 앤 드롭 박스 */}
        <div
          className={`upload-box ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <label htmlFor="excel-upload" className="upload-label">
            <img src={file} alt="파일 아이콘" />
            {!fileName && <span> 파일을 선택하거나 끌어오세요.</span>}
          </label>
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {fileName && <span className="file-name">{fileName}</span>}
        </div>

        <div className="button-wrapper">
          <button
            onClick={handleSubmit}
            disabled={isGenerating}
            className={`generate-button ${isGenerating ? 'disabled' : ''}`}
          >
            {isGenerating ? '업로드 중' : '생성하기'}
            {isGenerating && <Spinner />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadExcel;
