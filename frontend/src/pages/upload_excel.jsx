import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './upload_excel.css';
import { file } from '../assets/icons';
import Spinner from '../component/Shared/Spinner'; 


function UploadExcel() {
  const [fileName, setFileName] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = () => {
    // 여기에 파일 업로드 처리나 검증 로직이 들어갈 수 있음
    if (!fileName) {
      alert('파일을 선택해주세요.');
      return;
    }
      setIsGenerating(true);
    setTimeout(() => {
      navigate('/complaints');
    }, 2000);
 // complaints 페이지로 이동
  };


  return (
    <div className="upload_excel-page-wrapper">
      <div className="excel-container">
        <h2 className="title">엑셀 파일 양식을 다운로드 후 양식에 맞게 작성하여 아래 박스에 업로드 해주세요.</h2>
        
        <a className="example-link" href="/excel-template.xlsx" download>
          <img src={file} alt="파일 아이콘" /><span> Excel 양식.xlsx</span>
        </a>

        <div className="upload-box">
          <label htmlFor="excel-upload" className="upload-label">
            <img src={file} alt="파일 아이콘" /> Excel 파일 삽입
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
            {isGenerating ? '생성 중' : '생성하기'}
            {isGenerating && <Spinner />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadExcel;
