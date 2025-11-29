# Fix for "Client closed" Error in SonarQube MCP

## Problem

The logs show:

- Containers start successfully
- Immediately get "Client closed for command"
- Multiple containers get created as Cursor retries

This indicates the Docker container starts but the stdio communication isn't working properly.

## Root Cause

On Windows, there can be issues with:

1. **Environment variables not being passed correctly** from Cursor's `env` section to Docker
2. **Stdio binary/text mode** issues on Windows
3. **Container exiting immediately** if credentials are invalid

## Solution

### Step 1: Verify Your Configuration

Check that your `%USERPROFILE%\.cursor\mcp.json` has:

- Real credentials (not placeholders)
- Correct Docker command format

### Step 2: Test Container Manually

Run this command to see if the container actually works:

```powershell
docker run -i --rm -e SONARQUBE_TOKEN="YOUR_ACTUAL_TOKEN" -e SONARQUBE_ORG="debonairsm" mcp/sonarqube
```

If this fails or exits immediately, your credentials are likely wrong.

### Step 3: Check Container Logs

Start a container in detached mode and check its logs:

```powershell
$containerId = docker run -d --rm -e SONARQUBE_TOKEN="YOUR_TOKEN" -e SONARQUBE_ORG="debonairsm" mcp/sonarqube
docker logs $containerId
docker stop $containerId
```

This will show you any error messages from the MCP server.

### Step 4: Ensure Configuration is Correct

Your `mcp.json` should look like this:

```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--init",
        "-e",
        "SONARQUBE_TOKEN",
        "-e",
        "SONARQUBE_ORG",
        "mcp/sonarqube"
      ],
      "env": {
        "SONARQUBE_TOKEN": "your_actual_token_here",
        "SONARQUBE_ORG": "debonairsm"
      }
    }
  }
}
```

**Critical**: Make sure `SONARQUBE_TOKEN` has your actual token, not `YOUR_SONARQUBE_USER_TOKEN` or any placeholder.

### Step 5: Clean Up and Restart

1. Stop all SonarQube containers:

   ```powershell
   docker ps --filter "ancestor=mcp/sonarqube" --format "{{.ID}}" | ForEach-Object { docker stop $_ }
   ```

2. Completely restart Cursor (close all windows)

3. Check Cursor's MCP logs again

## Alternative: Check if Token is Valid

Test your SonarCloud token directly:

```powershell
$token = "YOUR_TOKEN"
$org = "debonairsm"
curl -u "$token`:" "https://sonarcloud.io/api/authentication/validate"
```

If this fails, you need to generate a new token from SonarCloud.

## Why "Client closed" Happens

The "Client closed" error occurs when:

1. **Container starts** → Docker successfully launches the container
2. **MCP server inside fails** → Either due to invalid credentials, missing env vars, or initialization error
3. **Container exits** → The process inside stops, closing the stdio streams
4. **Cursor sees closure** → Interprets this as "Client closed"
5. **Cursor retries** → Creates a new container, repeating the cycle

## Still Not Working?

If the container starts but still shows "Client closed", the issue might be:

1. **Token is invalid or expired** - Generate a new one
2. **Organization key is wrong** - Check your SonarCloud URL
3. **MCP server version issue** - Try pulling the latest image:

   ```powershell
   docker pull mcp/sonarqube
   ```

4. **Cursor version issue** - Update Cursor to the latest version

Run the diagnostic script:

```powershell
cd .cursor
.\diagnose-sonarqube-mcp.ps1
```

