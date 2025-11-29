# SonarQube MCP Setup Script for Windows
# This script helps set up and verify the SonarQube MCP configuration for Cursor

$ErrorActionPreference = "Stop"

Write-Host "SonarQube MCP Setup Script" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker command failed"
    }
    Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed or not accessible" -ForegroundColor Red
    Write-Host "  Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker daemon is running
Write-Host "Checking Docker daemon..." -ForegroundColor Yellow
try {
    docker ps 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker daemon not running"
    }
    Write-Host "✓ Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker daemon is not running" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Get user profile path
$userProfile = $env:USERPROFILE
$cursorDir = Join-Path $userProfile ".cursor"
$mcpJsonPath = Join-Path $cursorDir "mcp.json"

Write-Host ""
Write-Host "Configuration file location: $mcpJsonPath" -ForegroundColor Cyan
Write-Host ""

# Check if .cursor directory exists
if (-not (Test-Path $cursorDir)) {
    Write-Host "Creating .cursor directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $cursorDir -Force | Out-Null
    Write-Host "✓ Created .cursor directory" -ForegroundColor Green
}

# Prompt for SonarCloud token
$token = Read-Host "Enter your SonarCloud token (or press Enter to skip)"
if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "⚠ Skipping token setup. You'll need to configure it manually." -ForegroundColor Yellow
    $token = "YOUR_SONARQUBE_USER_TOKEN"
}

# Prompt for organization (with default)
$org = Read-Host "Enter your SonarCloud organization key [debonairsm]"
if ([string]::IsNullOrWhiteSpace($org)) {
    $org = "debonairsm"
}

# Read existing mcp.json if it exists
$mcpConfig = @{
    mcpServers = @{}
}

if (Test-Path $mcpJsonPath) {
    Write-Host "Reading existing mcp.json..." -ForegroundColor Yellow
    try {
        $existingContent = Get-Content $mcpJsonPath -Raw | ConvertFrom-Json
        if ($existingContent.mcpServers) {
            $mcpConfig.mcpServers = $existingContent.mcpServers.PSObject.Properties | ForEach-Object {
                @{ $_.Name = $_.Value }
            }
        }
        Write-Host "✓ Read existing configuration" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Could not parse existing mcp.json. Creating new configuration." -ForegroundColor Yellow
    }
} else {
    Write-Host "Creating new mcp.json..." -ForegroundColor Yellow
}

# Update or add SonarQube configuration
# Following official GitHub repo: https://github.com/SonarSource/sonarqube-mcp-server
$mcpConfig.mcpServers["sonarqube"] = @{
    command = "docker"
    args = @(
        "run",
        "-i",
        "--name",
        "sonarqube-mcp-server",
        "--rm",
        "-e",
        "SONARQUBE_TOKEN",
        "-e",
        "SONARQUBE_ORG",
        "mcp/sonarqube"
    )
    env = @{
        SONARQUBE_TOKEN = $token
        SONARQUBE_ORG = $org
    }
}

# Write configuration
Write-Host "Writing configuration to mcp.json..." -ForegroundColor Yellow
try {
    $jsonContent = $mcpConfig | ConvertTo-Json -Depth 10
    $jsonContent | Out-File -FilePath $mcpJsonPath -Encoding utf8 -Force
    Write-Host "✓ Configuration saved successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to write configuration: $_" -ForegroundColor Red
    exit 1
}

# Pull Docker image
Write-Host ""
Write-Host "Pulling SonarQube MCP Docker image..." -ForegroundColor Yellow
try {
    docker pull mcp/sonarqube 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to pull image"
    }
    Write-Host "✓ Docker image pulled successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠ Could not pull Docker image. You may need to run: docker pull mcp/sonarqube" -ForegroundColor Yellow
}

# Test configuration (if token is provided)
if ($token -ne "YOUR_SONARQUBE_USER_TOKEN") {
    Write-Host ""
    Write-Host "Testing configuration..." -ForegroundColor Yellow
    Write-Host "  (This will test if the Docker container can start with your credentials)" -ForegroundColor Gray
    
    $testResult = docker run --rm `
        -e "SONARQUBE_TOKEN=$token" `
        -e "SONARQUBE_ORG=$org" `
        mcp/sonarqube `
        --version 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Configuration test passed" -ForegroundColor Green
    } else {
        Write-Host "⚠ Configuration test had issues, but this might be normal for MCP servers" -ForegroundColor Yellow
        Write-Host "  Error output: $testResult" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart Cursor IDE completely" -ForegroundColor White
Write-Host "2. Verify the SonarQube MCP server appears in Cursor's MCP server list" -ForegroundColor White
Write-Host "3. If issues persist, check:" -ForegroundColor White
Write-Host "   - Docker Desktop is running" -ForegroundColor Gray
Write-Host "   - Your SonarCloud token is valid" -ForegroundColor Gray
Write-Host "   - Your organization key is correct" -ForegroundColor Gray
Write-Host ""
Write-Host "Configuration file: $mcpJsonPath" -ForegroundColor Cyan


