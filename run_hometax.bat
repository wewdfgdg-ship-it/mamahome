@echo off
chcp 65001 > nul
title 홈택스 공인인증서 자동 로그인

echo.
echo ========================================
echo    홈택스 공인인증서 자동 로그인
echo ========================================
echo.

echo 🔍 환경 테스트를 먼저 실행합니다...
python test_imports.py

echo.
echo 🚀 홈택스 로그인 스크립트를 실행합니다...
python hometax_login.py

echo.
echo 프로그램이 종료되었습니다.
pause