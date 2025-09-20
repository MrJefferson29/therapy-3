# PowerShell script to start backend with TinyLlama enabled
Write-Host "Starting backend with TinyLlama enabled..." -ForegroundColor Green
$env:USE_TINYLLAMA = "true"
Set-Location backend
npm start
