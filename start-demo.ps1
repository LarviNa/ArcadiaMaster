Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     Iniciando Frontends de Arcadia       " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar Frontend Tienda (Clientes)
Write-Host "[1/3] Iniciando Frontend Tienda en el puerto 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Frontend\Arcadia-FrontEnd-Clientes; npm.cmd run dev"

# Iniciar Frontend Login
Write-Host "[2/3] Iniciando Frontend Login en el puerto 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Frontend\Arcadia-FrontEnd-Login; npm.cmd run dev"

# Iniciar Frontend Admin
Write-Host "[3/3] Iniciando Frontend Admin en el puerto 5174..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Frontend\Arcadia-FrontEnd-Admin; npm.cmd run dev"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Abre tu navegador en:" -ForegroundColor Green
Write-Host "  -> Login: http://localhost:5173" -ForegroundColor Green
Write-Host "  -> Tienda: http://localhost:3000" -ForegroundColor Green
Write-Host "  -> Admin: http://localhost:5174" -ForegroundColor Green
Write-Host ""
Write-Host "Flujo de login:" -ForegroundColor Cyan
Write-Host "  -> Usuarios con rol 'Admin' -> http://localhost:5174" -ForegroundColor Cyan
Write-Host "  -> Usuarios con rol 'Cliente' -> http://localhost:3000" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Green
