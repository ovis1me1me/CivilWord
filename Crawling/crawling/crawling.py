from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import pandas as pd
import os
import json
import time
import datetime

# 폴더 설정 및 생성
backup_folder = "./data/backup"
final_folder = "./data/final"

os.makedirs(backup_folder, exist_ok=True)
os.makedirs(final_folder, exist_ok=True)

# 시간 측정 시작
start_time = time.time()

# 크롬 드라이버 설정
service = Service('./WebDriver/chromedriver.exe')
options = webdriver.ChromeOptions()
options.add_argument('headless')
options.add_argument('disable-gpu')
options.add_argument('window-size=1920x1080')
driver = webdriver.Chrome(service=service, options=options)
driver.implicitly_wait(3)

# 체크포인트 로드
checkpoint_file = "checkpoint.json"
if os.path.exists(checkpoint_file):
    with open(checkpoint_file, "r", encoding="utf-8") as f:
        checkpoint = json.load(f)
    page_num = checkpoint["page"]
    data = checkpoint["data"]
else:
    page_num = 1
    data = []

# 사이트 접속 및 이동
driver.get("https://eminwon.saha.go.kr/emwp")
driver.execute_script("fnPostLink('/gov/mogaha/ntis/web/emwp/cns/action/EmwpCnslWebAction','selectCnslWebPage','EMWPCnslWebInqL','EmwpCnslWebEJB','selectCnslWebPage','link');")
WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'table.table tbody tr')))

# 페이지 건너뛰기
if page_num > 1:
    print(f"\n🔄 {page_num}페이지로 이동 중")
    for _ in range(1, page_num):
        try:
            next_btn = driver.find_element(By.CSS_SELECTOR, 'a[title="다음 페이지"]')
            driver.execute_script("arguments[0].click();", next_btn)
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'table.table tbody tr')))
            time.sleep(0.5)
        except:
            print("⚠️ 페이지 이동 중 오류 발생")
            break

# 페이지 순회
while True:
    print(f"\n📄 {page_num}페이지 수집 시작")
    rows = driver.find_elements(By.CSS_SELECTOR, 'table.table tbody tr')

    for i in range(len(rows)):
        try:
            rows = driver.find_elements(By.CSS_SELECTOR, 'table.table tbody tr')
            row = rows[i]

            # 답변 상태 확인
            answer_status = row.find_element(By.CSS_SELECTOR, 'td.td-answer').text.strip()
            if answer_status not in ["답변완료", "이송이첩"]:
                continue # 접수 등은 무시

            a_tag = row.find_element(By.CSS_SELECTOR, 'td.td-list a')
            title_text = a_tag.text.strip()
            if title_text == "[관리자에 의해 삭제되었습니다.]":
                continue # 삭제된 답변 무시
            href = a_tag.get_attribute("href")

            # 상세 페이지 이동
            driver.execute_script(href)
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'table.table-board')))

            soup = BeautifulSoup(driver.page_source, 'html.parser')

            date_tag = soup.find('th', string='작성일')
            writedate = date_tag.find_next_sibling('td').get_text(strip=True) if date_tag else "없음"

            dept_tag = soup.find('th', string='담당부서')
            dept = dept_tag.find_next_sibling('td').get_text(strip=True) if dept_tag else "없음"

            content_cells = soup.select('table.table-board td[colspan="6"]')
            content = content_cells[0].get_text(strip=True) if len(content_cells) > 0 else "없음"
            answer = content_cells[1].get_text(strip=True) if len(content_cells) > 1 else "없음"

            data.append({
                "제목": title_text,
                "답변상태": answer_status,
                "작성일": writedate,
                "담당부서": dept,
                "작성내용": content,
                "답변내용": answer
            })

            # 리스트로 돌아가기
            driver.execute_script("fnList();")
            WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'table.table tbody tr')))

            # 백업 저장
            if len(data) % 1000 == 0:
                backup_filename = os.path.join(backup_folder, f"backup_{len(data)}.csv")
                pd.DataFrame(data).to_csv(backup_filename, index=False, encoding='utf-8-sig')
                print(f"💾 {backup_filename} 백업 저장 완료")

        except Exception as e:
            print(f"⚠️ {i+1}번째 민원 오류: {e}")
            driver.execute_script("fnList();")
            WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'table.table tbody tr')))

    # 체크포인트 저장
    with open(checkpoint_file, "w", encoding="utf-8") as f:
        json.dump({"page": page_num + 1, "data": data}, f, ensure_ascii=False, indent=2)

    # 다음 페이지 이동
    try:
        next_btn = driver.find_element(By.CSS_SELECTOR, 'a[title="다음 페이지"]')
        href = next_btn.get_attribute("href")

        if href == "javascript:void(0);":
            print("\n🚫 더 이상 다음 페이지가 없습니다. (마지막 페이지)")
            break

        driver.execute_script("arguments[0].click();", next_btn)
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'table.table tbody tr')))
        page_num += 1

    except Exception as e:
        print(f"\n⚠️ 다음 페이지 이동 중 오류 발생: {e}")
        break

# 최종 결과 저장
df = pd.DataFrame(data)
final_filename = os.path.join(final_folder, "saha_crawling_data.csv")
df.to_csv(final_filename, index=False, encoding='utf-8-sig')
print(f"\n✅ 전체 민원 CSV 저장 완료: {final_filename}")

# 시간 종료 및 출력
end_time = time.time()
total_time = end_time - start_time
total_time_str = str(datetime.timedelta(seconds=int(total_time)))
print(f"🕒 크롤링 소요 시간: {total_time_str}")

driver.quit()
