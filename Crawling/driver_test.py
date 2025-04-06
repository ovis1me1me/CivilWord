from selenium import webdriver

# chromedriver.exe 파일이 있는 경로
driver = './WebDriver/chromedriver.exe'

wd = webdriver.Chrome()
wd.get('https://www.naver.com/')
# webdriver.Chrome(driver).get('https://www.naver.com/') 위에 두줄과 동일

wd.close()  # 브라우저가 실행되었다가 자동으로 닫힌다.