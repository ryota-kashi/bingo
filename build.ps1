<# 
  build.ps1 - BINGO景品くじアプリ ビルドスクリプト
  日本語パスでもビルドできるよう、一時フォルダにコピーしてビルドします。
#>

$ErrorActionPreference = "Stop"

$ProjectDir = $PSScriptRoot
$TempDir = "C:\temp-bingo-build"
$DistDir = Join-Path $ProjectDir "dist"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BINGO景品くじ - ビルド開始" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 一時フォルダの準備
Write-Host "`n[1/5] 一時フォルダを準備中..." -ForegroundColor Yellow
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }

# プロジェクトファイルをコピー（node_modules, .git, dist を除外）
$excludeDirs = @('.git', 'node_modules', 'dist', 'out')
Get-ChildItem $ProjectDir -Force | Where-Object {
    $excludeDirs -notcontains $_.Name
} | ForEach-Object {
    Copy-Item -Recurse -Force $_.FullName (Join-Path $TempDir $_.Name)
}
Write-Host "  -> コピー完了" -ForegroundColor Green

# npm install
Write-Host "`n[2/5] npm install 実行中..." -ForegroundColor Yellow
Push-Location $TempDir
npm install --loglevel=error 2>&1
if ($LASTEXITCODE -ne 0) { throw "npm install に失敗しました" }
Write-Host "  -> インストール完了" -ForegroundColor Green

# ビルド
Write-Host "`n[3/5] electron-builder でビルド中..." -ForegroundColor Yellow
npx electron-builder --win 2>&1
if ($LASTEXITCODE -ne 0) { throw "ビルドに失敗しました" }
Write-Host "  -> ビルド完了" -ForegroundColor Green
Pop-Location

# 成果物をコピー
Write-Host "`n[4/5] 成果物をコピー中..." -ForegroundColor Yellow
if (!(Test-Path $DistDir)) { New-Item -ItemType Directory -Path $DistDir -Force | Out-Null }
Copy-Item "$TempDir\dist\*.exe" $DistDir -Force
Write-Host "  -> dist/ にコピー完了" -ForegroundColor Green

# クリーンアップ
Write-Host "`n[5/5] 一時フォルダを削除中..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $TempDir
Write-Host "  -> クリーンアップ完了" -ForegroundColor Green

$exeFile = Get-ChildItem $DistDir -Filter "*.exe" | Select-Object -First 1
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ビルド完了！" -ForegroundColor Cyan
Write-Host "  出力: $($exeFile.FullName)" -ForegroundColor Green
Write-Host "  サイズ: $([math]::Round($exeFile.Length/1MB, 1)) MB" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
