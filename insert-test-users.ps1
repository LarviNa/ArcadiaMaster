Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Insertando Usuarios de Prueba         " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Registrar Admin
Write-Host "[1/2] Registrando usuario Admin..." -ForegroundColor Yellow
$bodyAdmin = @{
    nombre = "Administrador"
    email = "admin@arcadia.com"
    password = "Admin1234!"
    rol = "ADMIN"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8083/api/usuarios/registro" -Method POST -Body $bodyAdmin -ContentType "application/json"
    Write-Host "  ✓ Admin registrado exitosamente" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "  ! Admin ya existe (esto es normal)" -ForegroundColor Yellow
    } else {
        Write-Host "  ✗ Error al registrar Admin: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Registrar Cliente
Write-Host "[2/2] Registrando usuario Cliente..." -ForegroundColor Yellow
$bodyCliente = @{
    nombre = "Cliente Demo"
    email = "cliente@arcadia.com"
    password = "Cliente1234!"
    rol = "CLIENTE"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8083/api/usuarios/registro" -Method POST -Body $bodyCliente -ContentType "application/json"
    Write-Host "  ✓ Cliente registrado exitosamente" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "  ! Cliente ya existe (esto es normal)" -ForegroundColor Yellow
    } else {
        Write-Host "  ✗ Error al registrar Cliente: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Usuarios de prueba:" -ForegroundColor Green
Write-Host "  Admin:    admin@arcadia.com / Admin1234!" -ForegroundColor Green
Write-Host "  Cliente:  cliente@arcadia.com / Cliente1234!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
