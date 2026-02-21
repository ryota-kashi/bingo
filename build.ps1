<# 
  build.ps1 - BINGO App Build Script
#>

$ErrorActionPreference = "Stop"

$ProjectDir = $PSScriptRoot
$TempDir = "C:\temp-bingo-build"
$DistDir = Join-Path $ProjectDir "dist"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BINGO App - Build Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Prepare Temp Directory
Write-Host "`n[1/5] Preparing Temp Directory..." -ForegroundColor Yellow
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }

# Step 2: Copy Files
Write-Host "[2/5] Copying project files..." -ForegroundColor Yellow
$excludeDirs = @('.git', 'node_modules', 'dist', 'out')
Get-ChildItem -Path $ProjectDir -Force | Where-Object {
  $excludeDirs -notcontains $_.Name
} | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination (Join-Path $TempDir $_.Name) -Recurse -Force
}
Write-Host "  -> Copy Completed" -ForegroundColor Green

# Step 3: npm install
Write-Host "`n[3/5] Running npm install..." -ForegroundColor Yellow
Push-Location $TempDir
npm install --loglevel=error
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
Write-Host "  -> Install Completed" -ForegroundColor Green

# Step 4: Build
Write-Host "`n[4/5] Building with electron-builder..." -ForegroundColor Yellow
npx electron-builder --win
if ($LASTEXITCODE -ne 0) { throw "Build failed" }
Write-Host "  -> Build Completed" -ForegroundColor Green
Pop-Location

# Step 5: Copy Artifacts
Write-Host "`n[5/5] Copying artifacts..." -ForegroundColor Yellow
if (!(Test-Path $DistDir)) { New-Item -ItemType Directory -Path $DistDir -Force | Out-Null }
Copy-Item -Path "$TempDir\dist\*.exe" -Destination $DistDir -Force
Write-Host "  -> Copied to dist/" -ForegroundColor Green

# Cleanup
Write-Host "`nCleaning up temp directory..." -ForegroundColor Yellow
Remove-Item -Path $TempDir -Recurse -Force
Write-Host "  -> Cleanup Completed" -ForegroundColor Green

$exeFile = Get-ChildItem -Path $DistDir -Filter "*.exe" | Select-Object -First 1
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Build Completed!" -ForegroundColor Cyan
if ($null -ne $exeFile) {
  Write-Host "  Output: $($exeFile.FullName)" -ForegroundColor Green
  Write-Host "  Size: $([math]::Round($exeFile.Length/1MB, 1)) MB" -ForegroundColor Green
}
Write-Host "========================================" -ForegroundColor Cyan
