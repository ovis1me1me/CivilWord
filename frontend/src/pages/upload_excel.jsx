import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./upload_excel.css";
import { file as fileIcon } from "../assets/icons";
import Spinner from "../component/Shared/Spinner";
import { uploadExcelFile, createComplaint } from "../utils/api";

export default function UploadPage() {
  // 탭 전환 (엑셀 / 단일 입력)
  const [mode, setMode] = useState("excel");

  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // 엑셀 업로드 상태
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileName, setExcelFileName] = useState("");
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // 단일 민원 상태
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  // --- Drag & Drop 핸들러 (라벨을 드랍존으로 사용) ---
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setErrorMsg("엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.");
      return;
    }
    setExcelFile(file);
    setExcelFileName(file.name);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!/\.(xlsx|xls)$/i.test(selected.name)) {
      setErrorMsg("엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.");
      return;
    }
    setExcelFile(selected);
    setExcelFileName(selected.name);
  };

  const clearFile = () => {
    setExcelFile(null);
    setExcelFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (mode === "excel") {
        if (!excelFile) {
          setErrorMsg("엑셀 파일을 선택하거나 드래그 앤 드랍 해주세요.");
          return;
        }
        const res = await uploadExcelFile(excelFile);
        alert(res.data?.message || "엑셀 업로드 완료");
        navigate("/complaints");
        return;
      }

      // 단일 입력 검증
      if (!title.trim()) {
        setErrorMsg("제목을 입력해주세요.");
        return;
      }
      if (!content.trim()) {
        setErrorMsg("내용을 입력해주세요.");
        return;
      }

      await createComplaint({
        title: title.trim(),
        content: content.trim(),
        is_public: isPublic,
      });

      alert("민원이 등록되었습니다.");
      navigate("/complaints");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "요청 처리 중 오류가 발생했습니다.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="excel-page-wrapper">
      <div className="excel-container">
        <h2 className="title">※ 아래 두 가지 방법 중 하나를 택해 민원을 입력해주세요.</h2>
        <ol className="subtitle-list">
          <li>하나의 민원에 대한 답변을 생성하려면 제목과 내용을 입력하고 공개 여부를 체크해주세요.</li>
          <li>엑셀 파일 양식을 다운로드 후 양식에 맞게 작성하여 아래 박스에 업로드 해주세요.</li>
        </ol>

        <a className="example-link" href="/excel-template.xlsx" download>
          <img src={fileIcon} alt="파일 아이콘" />
          <span> Excel 양식.xlsx</span>
        </a>

        <div className="tab-switcher" role="tablist" aria-label="입력 방식 선택">
          <button
            role="tab"
            aria-selected={mode === "excel"}
            className={`tab ${mode === "excel" ? "active" : ""}`}
            onClick={() => setMode("excel")}
          >
            엑셀 업로드
          </button>
          <button
            role="tab"
            aria-selected={mode === "single"}
            className={`tab ${mode === "single" ? "active" : ""}`}
            onClick={() => setMode("single")}
          >
            단일 민원 입력
          </button>
        </div>

        {mode === "excel" ? (
          <section className="panel">
            <label
              htmlFor="excel-upload"
              className={`upload-box ${isDragOver ? "dragover" : ""}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="upload-label">
                <img src={fileIcon} alt="파일 아이콘" />
                {!excelFileName ? (
                  <span>Excel 파일 삽입</span>
                ) : (
                  <span className="file-name">{excelFileName}</span>
                )}
              </div>
              <input
                id="excel-upload"
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </label>
            {excelFileName && (
              <div className="file-actions">
                <button className="btn-secondary" onClick={clearFile} disabled={isSubmitting}>
                  선택 해제
                </button>
              </div>
            )}
          </section>
        ) : (
          <section className="panel">
            <div className="field">
              <div className="field-row">
                <label htmlFor="complaint-title">제목</label>
                <div className="public-row">
                  <input
                    id="public-toggle"
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <label htmlFor="public-toggle">공개</label>
                </div>
              </div>
              <input
                id="complaint-title"
                type="text"
                placeholder="제목 입력"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="field">
              <label htmlFor="complaint-content">내용</label>
              <textarea
                id="complaint-content"
                placeholder="내용 입력"
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="text-area"
              />
            </div>
          </section>
        )}

        {errorMsg && <p className="error-text">{errorMsg}</p>}

        <div className="button-wrapper">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`generate-button ${isSubmitting ? "disabled" : ""}`}
          >
            {isSubmitting ? "생성 중" : "생성하기"}
            {isSubmitting && <Spinner />}
          </button>
        </div>
      </div>
    </div>
  );
}
