# ProP2P Deployment Manager (PowerShell)
# Manages deployments, monitoring, and rollbacks on the production server

param(
    [Parameter(Position=0)]
    [string]$Command = "status",
    
    [Parameter(Position=1)]
    [string]$Service = "",
    
    [Parameter(Position=2)]
    [int]$Lines = 100,
    
    [Parameter(Position=3)]
    [string]$Target = "previous",
    
    [Parameter(Position=4)]
    [int]$KeepCount = 5,
    
    [switch]$Help
)

# Configuration
$RepoDir = if ($env:REPO_DIR) { $env:REPO_DIR } else { "/opt/prop2p" }
$CurrentDeploy = Join-Path $RepoDir "current"
$BackupDir = Join-Path $RepoDir "backups"
$DeploymentsDir = Join-Path $RepoDir "deployments"
$ComposeFile = Join-Path $RepoDir "docker-compose.prod.yml"

# Colors
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Logging functions
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Blue
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

# Health check function
function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [int]$Port
    )
    
    Write-Log "Checking health of $ServiceName on port $Port..."
    $maxAttempts = 10
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "$ServiceName is healthy!"
                return $true
            }
        } catch {
            # Ignore errors
        }
        
        Write-Warning "Attempt $attempt/${maxAttempts}: $ServiceName not ready yet..."
        Start-Sleep -Seconds 2
        $attempt++
    }
    
    Write-Error "$ServiceName failed health check after $maxAttempts attempts"
    return $false
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check if Docker is available
    try {
        docker --version | Out-Null
    } catch {
        Write-Error "Docker is not available"
        exit 1
    }
    
    # Check if Docker Compose is available
    try {
        docker-compose --version | Out-Null
    } catch {
        Write-Error "Docker Compose is not available"
        exit 1
    }
    
    # Check if repository directory exists
    if (-not (Test-Path $RepoDir)) {
        Write-Error "Repository directory $RepoDir not found"
        exit 1
    }
    
    # Check if compose file exists
    if (-not (Test-Path $ComposeFile)) {
        Write-Error "Docker Compose file $ComposeFile not found"
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Show current status
function Show-Status {
    Write-Log "Current deployment status:"
    Write-Host "==================================" -ForegroundColor $Blue
    
    if (Test-Path $CurrentDeploy -PathType Any) {
        $currentPath = Get-Item $CurrentDeploy | Select-Object -ExpandProperty LinkType
        Write-Host "Current deployment: $currentPath"
        $deployInfo = Get-Item $CurrentDeploy
        Write-Host "Deployment age: $($deployInfo.LastWriteTime.ToString('yyyy-MM-dd'))"
    } else {
        Write-Warning "No current deployment symlink found"
    }
    
    Write-Host ""
    Write-Host "Docker containers:" -ForegroundColor $Blue
    docker-compose -f $ComposeFile ps
    
    Write-Host ""
    Write-Host "Service health:" -ForegroundColor $Blue
    
    # Check backend
    if (Test-ServiceHealth "Backend" 8000) {
        Write-Success "Backend: Healthy"
    } else {
        Write-Error "Backend: Unhealthy"
    }
    
    # Check frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend: Healthy"
        } else {
            Write-Error "Frontend: Unhealthy"
        }
    } catch {
        Write-Error "Frontend: Unhealthy"
    }
    
    # Check database
    try {
        $dbCheck = docker-compose -f $ComposeFile exec -T db pg_isready -U prop2p 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database: Healthy"
        } else {
            Write-Error "Database: Unhealthy"
        }
    } catch {
        Write-Error "Database: Unhealthy"
    }
}

# Show logs
function Show-Logs {
    param(
        [string]$Service = "",
        [int]$Lines = 100
    )
    
    if ([string]::IsNullOrEmpty($Service)) {
        Write-Log "Showing logs for all services (last $Lines lines):"
        docker-compose -f $ComposeFile logs --tail=$Lines
    } else {
        Write-Log "Showing logs for $Service (last $Lines lines):"
        docker-compose -f $ComposeFile logs --tail=$Lines $Service
    }
}

# Restart service
function Restart-Service {
    param([string]$Service)
    
    if ([string]::IsNullOrEmpty($Service)) {
        Write-Error "Please specify a service to restart (backend, frontend, db)"
        exit 1
    }
    
    Write-Log "Restarting $Service..."
    docker-compose -f $ComposeFile restart $Service
    
    # Wait for service to be healthy
    switch ($Service) {
        "backend" {
            Test-ServiceHealth "backend" 8000
        }
        "frontend" {
            Test-ServiceHealth "frontend" 3000
        }
        "db" {
            Write-Log "Waiting for database to be ready..."
            Start-Sleep -Seconds 5
        }
        default {
            Write-Warning "Health check not implemented for $Service"
        }
    }
    
    Write-Success "$Service restarted successfully"
}

# Rollback to previous deployment
function Invoke-Rollback {
    param([string]$Target = "previous")
    
    Write-Log "Rolling back to $Target deployment..."
    
    if (-not (Test-Path $CurrentDeploy -PathType Any)) {
        Write-Error "No current deployment found"
        exit 1
    }
    
    $currentPath = Get-Item $CurrentDeploy | Select-Object -ExpandProperty Target
    $rollbackPath = ""
    
    switch ($Target) {
        "previous" {
            # Find the most recent deployment that's not current
            $deployments = Get-ChildItem $DeploymentsDir -Directory | Where-Object { $_.Name -ne (Split-Path $currentPath -Leaf) } | Sort-Object LastWriteTime -Descending
            if ($deployments) {
                $rollbackPath = $deployments[0].FullName
            }
        }
        default {
            # Specific deployment
            $rollbackPath = Join-Path $DeploymentsDir $Target
        }
    }
    
    if ([string]::IsNullOrEmpty($rollbackPath) -or -not (Test-Path $rollbackPath)) {
        Write-Error "No rollback target found"
        exit 1
    }
    
    Write-Log "Rolling back to: $rollbackPath"
    
    # Stop current services
    Write-Log "Stopping current services..."
    docker-compose -f $ComposeFile down
    
    # Update symlink
    Write-Log "Updating deployment symlink..."
    Remove-Item $CurrentDeploy -Force
    New-Item -ItemType SymbolicLink -Path $CurrentDeploy -Target $rollbackPath
    
    # Start services from rollback
    Write-Log "Starting services from rollback..."
    Set-Location $rollbackPath
    docker-compose -f $ComposeFile up -d
    
    # Health check
    Write-Log "Performing health checks..."
    if ((Test-ServiceHealth "backend" 8000) -and (Test-ServiceHealth "frontend" 3000)) {
        Write-Success "Rollback completed successfully!"
    } else {
        Write-Error "Rollback health check failed"
        exit 1
    }
}

# Cleanup old deployments
function Invoke-Cleanup {
    param([int]$KeepCount = 5)
    
    Write-Log "Cleaning up old deployments (keeping last $KeepCount)..."
    
    if (-not (Test-Path $DeploymentsDir)) {
        Write-Warning "Deployments directory not found"
        return
    }
    
    Set-Location $DeploymentsDir
    $oldDeployments = Get-ChildItem -Directory | Sort-Object LastWriteTime -Descending | Select-Object -Skip $KeepCount
    
    if ($oldDeployments) {
        Write-Host "Removing old deployments:" -ForegroundColor $Yellow
        $oldDeployments | ForEach-Object { Write-Host $_.Name }
        $oldDeployments | Remove-Item -Recurse -Force
        Write-Success "Cleanup completed"
    } else {
        Write-Log "No old deployments to remove"
    }
    
    # Cleanup Docker
    Write-Log "Cleaning up Docker resources..."
    docker system prune -f
}

# Emergency stop
function Stop-Emergency {
    Write-Log "EMERGENCY STOP - Stopping all services..."
    docker-compose -f $ComposeFile down
    Write-Success "All services stopped"
}

# Emergency start
function Start-Emergency {
    Write-Log "EMERGENCY START - Starting all services..."
    docker-compose -f $ComposeFile up -d
    
    Write-Log "Waiting for services to be ready..."
    Start-Sleep -Seconds 10
    
    if ((Test-ServiceHealth "backend" 8000) -and (Test-ServiceHealth "frontend" 3000)) {
        Write-Success "Emergency start completed successfully!"
    } else {
        Write-Error "Emergency start health check failed"
        exit 1
    }
}

# Show help
function Show-Help {
    $helpText = @"
ProP2P Deployment Manager (PowerShell)

Usage: .\deploy-manager.ps1 [COMMAND] [OPTIONS]

Commands:
  status                    Show current deployment status
  logs [SERVICE] [LINES]   Show logs (default: all services, 100 lines)
  restart SERVICE          Restart a specific service
  rollback [TARGET]        Rollback to previous or specific deployment
  cleanup [COUNT]          Cleanup old deployments (default: keep 5)
  emergency-stop           Stop all services immediately
  emergency-start          Start all services
  help                     Show this help message

Examples:
  .\deploy-manager.ps1 status
  .\deploy-manager.ps1 logs backend 50
  .\deploy-manager.ps1 restart frontend
  .\deploy-manager.ps1 rollback
  .\deploy-manager.ps1 cleanup 3

Environment variables:
  REPO_DIR                 Repository directory (default: /opt/prop2p)

"@
    Write-Host $helpText
}

# Main script
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Test-Prerequisites
    
    switch ($Command) {
        "status" {
            Show-Status
        }
        "logs" {
            Show-Logs $Service $Lines
        }
        "restart" {
            Restart-Service $Service
        }
        "rollback" {
            Invoke-Rollback $Target
        }
        "cleanup" {
            Invoke-Cleanup $KeepCount
        }
        "emergency-stop" {
            Stop-Emergency
        }
        "emergency-start" {
            Start-Emergency
        }
        "help" {
            Show-Help
        }
        default {
            Write-Error "Unknown command: $Command"
            Show-Help
            exit 1
        }
    }
}

# Run main function
Main
