$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "=== 행복부자 어린이집 시작 ===" -ForegroundColor Green

Write-Host "[1/4] Prisma generate..."
npx prisma generate

Write-Host "[2/4] DB migrate..."
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
  Write-Host "migrate deploy failed, trying db push..."
  npx prisma db push --accept-data-loss
}

Write-Host "[3/4] Seed..."
npm run db:seed

$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
  $pid = ($port3000 | Select-Object -First 1).OwningProcess
  Write-Host "Port 3000 in use (PID $pid), stopping..."
  Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}

Write-Host "[4/4] Dev server starting at http://localhost:3000"
npm run dev
