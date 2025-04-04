# 🧠 DONGA_SW_PROJECT_CivilWord

**Local LLM을 활용한 새올 민원 자동 답변 생성기**  
> **동아대학교 소프트웨어 졸업작품 프로젝트**

---

## 👥 팀 구성

| 역할 | 이름 | 학번 | 이메일 |
|------|------|------|--------|
| 팀장 | 양한나 | 2243127 | 224317@donga.ac.kr |
| 팀원 | 임지은 | 2243255 | - |
| 팀원 | 배준영 | 2242844 | - |
| 팀원 | 임세희 | 2009816 | - |
| 팀원 | 최지은 | 2242833 | - |

---

## 📂 프로젝트 구조 안내

- `weekly/` 폴더 : 주간보고일지 저장 위치  
- `.ipynb`, `src/`, `data/` 등 : 각 파트별 코드 및 데이터 저장 예정  

---

## 📒 관련 자료

- 📌 **노션 프로젝트 대시보드**  
  [🔗 Notion 바로가기](https://www.notion.so/1ba190a28eaf80a39a12cfcd79b7e33b?v=1ba190a28eaf8073a3db000caf85ee67)

---

## ⚙️ 기술 스택

- FastAPI, Python
- Local LLM (예: LLaMA, Mistral)
- PostgreSQL, MongoDB
- Streamlit (GUI)
- Ubuntu WSL 개발 환경

---

## 🗓️ 일정 관리

- **주간보고일지**는 `weekly/` 폴더에 `.docx` 형식으로 저장
- 매주 일요일 오후 기준으로 업데이트

---
🚀 백엔드 실행 가이드 (FastAPI)
🧩 기본 요구사항
Python 3.10+

WSL 또는 Ubuntu 22.04

Git 클론 가능한 환경

📦 실행 순서
프로젝트 클론

bash
복사
편집
git clone https://github.com/your-username/DONGA_SW_PROJECT_CivilWord.git
cd DONGA_SW_PROJECT_CivilWord
Python 가상환경 생성 및 활성화 (WSL 기준)

bash
복사
편집
python3 -m venv venv
source venv/bin/activate
의존성 설치

bash
복사
편집
pip install -r requirements.txt
FastAPI 서버 실행

bash
복사
편집
uvicorn app.main:app --reload
Swagger UI 접속 (브라우저에서 테스트 가능) http://127.0.0.1:8000/docs


