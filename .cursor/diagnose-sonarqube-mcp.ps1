# Diagnostic script for SonarQube MCP issues
# This script helps identify why the SonarQube MCP server isn't working

Write-Host "SonarQube MCP Diagnostic Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check for running containers
Write-Host "Checking for running SonarQube MCP containers..." -ForegroundColor Yellow
$runningContainers = docker ps --filter "ancestor=mcp/sonarqube" --format "{{.ID}}"
if ($runningContainers) {
    Write-Host "⚠ Found running containers (this indicates connection issues):" -ForegroundColor Yellow
    docker ps --filter "ancestor=mcp/sonarqube" --format "table {{.ID}}\t{{.Status}}\t{{.Names}}"
    Write-Host ""
    $stopAll = Read-Host "Stop all SonarQube containers? (y/n)"
    if ($stopAll -eq "y") {
        docker ps --filter "ancestor=mcp/sonarqube" --format "{{.ID}}" | ForEach-Object { docker stop $_ }
        Write-Host "✓ Stopped all SonarQube containers" -ForegroundColor Green
    }
} else {
    Write-Host "✓ No running SonarQube containers" -ForegroundColor Green
}

Write-Host ""

# Check mcp.json configuration
$userProfile = $env:USERPROFILE
$mcpJsonPath = Join-Path $userProfile ".cursor\mcp.json"

Write-Host "Checking MCP configuration..." -ForegroundColor Yellow
if (Test-Path $mcpJsonPath) {
    Write-Host "✓ Configuration file exists: $mcpJsonPath" -ForegroundColor Green
    try {
        $config = Get-Content $mcpJsonPath -Raw | ConvertFrom-Json
        if ($config.mcpServers.sonarqube) {
            Write-Host "✓ SonarQube server configuration found" -ForegroundColor Green
            
            # Check environment variables
            if ($config.mcpServers.sonarqube.env) {
                $token = $config.mcpServers.sonarqube.env.SONARQUBE_TOKEN
                $org = $config.mcpServers.sonarqube.env.SONARQUBE_ORG
                
                if ($token -and $token -ne "YOUR_SONARQUBE_USER_TOKEN") {
                    Write-Host "✓ SONARQUBE_TOKEN is set (length: $($token.Length))" -ForegroundColor Green
                } else {
                    Write-Host "✗ SONARQUBE_TOKEN is not set or is placeholder" -ForegroundColor Red
                }
                
                if ($org) {
                    Write-Host "✓ SONARQUBE_ORG is set: $org" -ForegroundColor Green
                } else {
                    Write-Host "✗ SONARQUBE_ORG is not set" -ForegroundColor Red
                }
            } else {
                Write-Host "✗ No environment variables configured" -ForegroundColor Red
            }
        } else {
            Write-Host "✗ SonarQube server configuration not found" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Failed to parse configuration file: $_" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Configuration file not found: $mcpJsonPath" -ForegroundColor Red
    Write-Host "  Run the setup script to create it." -ForegroundColor Yellow
}

Write-Host ""

# Test Docker image
Write-Host "Testing Docker image..." -ForegroundColor Yellow
$imageExists = docker images mcp/sonarqube --format "{{.Repository}}:{{.Tag}}" | Select-Object -First 1
if ($imageExists) {
    Write-Host "✓ Docker image exists: $imageExists" -ForegroundColor Green
} else {
    Write-Host "✗ Docker image not found. Run: docker pull mcp/sonarqube" -ForegroundColor Red
}

Write-Host ""

# Test container startup (if credentials are available)
if ($token -and $token -ne "YOUR_SONARQUBE_USER_TOKEN" -and $org) {
    Write-Host "Testing container startup..." -ForegroundColor Yellow
    Write-Host "  (This will start a test container for 3 seconds)" -ForegroundColor Gray
    
    $testContainer = docker run -d --rm `
        -e "SONARQUBE_TOKEN=$token" `
        -e "SONARQUBE_ORG=$org" `
        mcp/sonarqube 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $containerId = $testContainer.Trim()
        Write-Host "✓ Container started successfully (ID: $containerId)" -ForegroundColor Green
        
        Start-Sleep -Seconds 2
        
        # Check if container is still running
        $status = docker ps --filter "id=$containerId" --format "{{.Status}}"
        if ($status) {
            Write-Host "✓ Container is still running" -ForegroundColor Green
            
            # Check logs
            Write-Host ""
            Write-Host "Container logs:" -ForegroundColor Cyan
            docker logs $containerId 2>&1 | Select-Object -First 10
            
            docker stop $containerId 2>&1 | Out-Null
        } else {
            Write-Host "✗ Container exited immediately (check logs above)" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ Failed to start container: $testContainer" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ Skipping container test (credentials not available)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Diagnostic Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "If you're still experiencing issues:" -ForegroundColor Cyan
Write-Host "1. Ensure your SonarCloud token is valid" -ForegroundColor White
Write-Host "2. Verify your organization key matches your SonarCloud URL" -ForegroundColor White
Write-Host "3. Restart Cursor completely after making configuration changes" -ForegroundColor White
Write-Host "4. Check Cursor's MCP logs for additional error messages" -ForegroundColor White


