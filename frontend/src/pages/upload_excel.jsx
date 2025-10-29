import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './upload_excel.css';
import { file as fileIcon } from '../assets/icons';
import Spinner from '../component/Shared/Spinner';
import { uploadExcelFile, createComplaint } from '../utils/api';

const ALLOWED_EXTS = ['.xlsx', '.xls'];

function UploadExcel() {
  const [mode, setMode] = useState('excel'); // "excel" | "single"
  const [fileName, setFileName] = useState('');
  const [fileObj, setFileObj] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const hasAllowedExt = (name = '') =>
    ALLOWED_EXTS.some(ext => name.toLowerCase().endsWith(ext));

  const handleFileAccept = (file) => {
    if (!hasAllowedExt(file.name)) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드할 수 있어요.');
      return false;
    }
    setFileName(file.name);
    setFileObj(file);
    return true;
  };

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
    try {
      setIsGenerating(true);

      if (mode === 'excel') {
        if (!fileObj) {
          alert('엑셀 파일을 선택하거나 끌어다 놓아주세요.');
          return;
        }
        await uploadExcelFile(fileObj);
      } else {
        if (!title.trim() || !content.trim()) {
          alert('제목과 내용을 모두 입력해주세요.');
          return;
        }
        await createComplaint({
          title: title.trim(),
          content: content.trim(),
          is_public: isPublic,
        });
      }

      alert('생성되었습니다.');
      navigate('/complaints');
    } catch (error) {
      const msg = error?.response?.data?.detail || '처리 중 오류가 발생했습니다.';
      alert(`실패: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="excel-page-wrapper">
      <div className="excel-container">
        {/* 헤더 안내 */}
        <h2 className="title">
          ※ 아래 두 가지 방법 중 하나를 택하여 민원을 입력해주세요.
        </h2>
        <ol className="intro-list">
          <li>하나의 민원에 대한 답변을 생성하려면 민원의 제목과 내용을 입력하고 공개 여부를 체크해주세요.</li>
          <li>엑셀 파일 양식을 다운로드 후 양식에 맞게 작성하여 아래 박스에 업로드 해주세요.</li>
        </ol>

        {/* 샘플 파일 링크 */}
        <a className="example-link" href="/excel-template.xlsx" download>
          <img src={fileIcon} alt="파일 아이콘" />
          <span> Excel 양식.xlsx</span>
        </a>

        {/* 모드 탭 */}
        <div className="mode-tabs" role="tablist" aria-label="입력 방식 선택">
          <button
            role="tab"
            aria-selected={mode === 'excel'}
            className={`tab-btn ${mode === 'excel' ? 'active' : ''}`}
            onClick={() => setMode('excel')}
          >
            엑셀 업로드
          </button>
          <button
            role="tab"
            aria-selected={mode === 'single'}
            className={`tab-btn ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
          >
            단일 민원 입력
          </button>
        </div>

        {/* 엑셀 업로드 모드 */}
        {mode === 'excel' && (
          <div
            className={`upload-box ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('excel-upload')?.click()}
          >
            <label htmlFor="excel-upload" className="upload-label">
              <img src={fileIcon} alt="파일 아이콘" />
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
        )}

        {/* 단일 민원 입력 모드 */}
        {mode === 'single' && (
          // ✅ 'upload-box' 클래스를 추가해 동일한 스타일을 적용합니다.
          <div className="single-form upload-box">
            <div className="field">
              <div className="label-row">
                <label htmlFor="title" className="label">제목</label>
                <label className="public-checkbox">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <span>공개</span>
                </label>
              </div>
              <input
                id="title"
                className="input"
                placeholder="제목 입력"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="content" className="label">내용 입력</label>
              <textarea
                id="content"
                className="textarea"
                placeholder="민원 내용을 입력하세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
              />
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="button-wrapper">
          <button
            onClick={handleSubmit}
            disabled={isGenerating}
            className={`generate-button ${isGenerating ? 'disabled' : ''}`}
          >
            {isGenerating ? '생성하기 중…' : '생성하기'}
            {isGenerating && <Spinner />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadExcel;