@echo off
cd /d "%~dp0.."
echo === 행복부자 어린이집 시작 ===
call npm run setup
if errorlevel 1 (
  echo DB setup failed. Trying db push...
  call npx prisma db push
  call npm run db:seed
)
echo.
echo http://localhost:3000 에서 실행됩니다.
call npm run dev
