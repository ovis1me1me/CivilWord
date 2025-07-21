from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import pandas as pd
import time

# 크롬 드라이버 설정
service = Service('./WebDriver/chromedriver.exe')
options = webdriver.ChromeOptions()
driver = webdriver.Chrome(service=service, options=options)

# 사이트 접속
driver.get("https://eminwon.saha.go.kr/emwp")
driver.maximize_window()
time.sleep(2)

# 공개 상담민원 조회로 이동
js = "fnPostLink('/gov/mogaha/ntis/web/emwp/cns/action/EmwpCnslWebAction','selectCnslWebPage','EMWPCnslWebInqL','EmwpCnslWebEJB','selectCnslWebPage','link');"
driver.execute_script(js)

# 목록 페이지 로딩 대기
WebDriverWait(driver, 20).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, 'table.table tbody tr'))
)

data = []

# 민원 10개만 수집
for i in range(10):
    print(f"📌 {i+1}번째 민원 처리 중...")

    # 민원 리스트 다시 가져오기 (매번 다시 가져와야 클릭 가능)
    rows = driver.find_elements(By.CSS_SELECTOR, 'table.table tbody tr')

    # 각 민원의 제목과 JavaScript 코드 추출
    a_tag = rows[i].find_element(By.CSS_SELECTOR, 'td.td-list a')
    title_text = a_tag.text.strip()  # 페이지 이동 전에 텍스트 추출
    href = a_tag.get_attribute("href")

    # JavaScript 실행으로 상세 페이지 진입
    driver.execute_script(href)

    # 상세 페이지 로딩 대기
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, 'table.table-board'))
    )

    soup = BeautifulSoup(driver.page_source, 'html.parser')

    # 담당 부서 추출
    dept_tag = soup.find('th', string='담당부서')
    dept = dept_tag.find_next_sibling('td').get_text(strip=True) if dept_tag else "없음"

    # 민원 내용 및 답변 내용 추출
    content_cells = soup.select('table.table-board td[colspan="6"]')
    content = content_cells[0].get_text(strip=True) if len(content_cells) > 0 else "없음"
    answer = content_cells[1].get_text(strip=True) if len(content_cells) > 1 else "없음"

    data.append({
        "제목": title_text,
        "담당부서": dept,
        "작성내용": content,
        "답변내용": answer
    })

    print(f"✅ {i+1}번째 민원 수집 완료")

    # 목록으로 돌아가기
    driver.execute_script("fnList();")
    time.sleep(1)

    # 다시 목록 페이지 로딩 대기
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, 'table.table tbody tr'))
    )

# Excel로 저장
df = pd.DataFrame(data)
df.to_excel("민원_크롤링_결과.xlsx", index=False)
print("📁 민원 데이터 Excel 저장 완료")

# 드라이버 종료
driver.quit()
