Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     Iniciando Backend de Arcadia         " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Función para iniciar un microservicio
function Start-Microservice ($Name, $Path, $Port) {
    Write-Host "Iniciando $Name en el puerto $Port..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; .\mvnw.cmd spring-boot:run"
}

Start-Microservice -Name "Microservicio Usuarios" -Path "backend\ms-usuarios" -Port 8085
Start-Microservice -Name "Microservicio Comics" -Path "backend\ms-comics" -Port 8081
Start-Microservice -Name "Microservicio Ventas" -Path "backend\ms-ventas" -Port 8082

Write-Host "Esperando unos segundos antes de iniciar el API Gateway..." -ForegroundColor DarkGray
Start-Sleep -Seconds 10

Start-Microservice -Name "API Gateway" -Path "backend\api-gateway" -Port 8083

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "¡Comandos de inicio enviados!" -ForegroundColor Green
Write-Host "Se han abierto nuevas ventanas para cada microservicio." -ForegroundColor Green
Write-Host "Por favor, revisa las nuevas ventanas para asegurarte de que" -ForegroundColor Green
Write-Host "cada uno inició correctamente (Busca 'Started [App] in...')." -ForegroundColor Green
Write-Host "El API Gateway ahora agrupa todo en http://localhost:8083" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
