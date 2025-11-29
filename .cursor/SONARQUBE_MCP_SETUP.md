# SonarQube MCP Server Setup Guide

This guide will help you set up the SonarQube MCP server for Cursor IDE to integrate with SonarCloud.

## Quick Fix for "No server info found" Error

If you're seeing the "No server info found" error, try these steps in order:

1. **Use the automated setup script** (Recommended):

   ```powershell
   cd .cursor
   .\setup-sonarqube-mcp.ps1
   ```

   This script will verify your setup and create/update the configuration file.

2. **Manually verify your configuration**:
   - Open `%USERPROFILE%\.cursor\mcp.json` (not in the project directory)
   - Ensure the JSON is valid (no trailing commas, proper syntax)
   - Verify both `SONARQUBE_TOKEN` and `SONARQUBE_ORG` are set in the `env` section

3. **Pull the Docker image**:

   ```powershell
   docker pull mcp/sonarqube
   ```

4. **Test the Docker container manually**:

   ```powershell
   docker run -i --rm -e SONARQUBE_TOKEN="your_token_here" -e SONARQUBE_ORG="debonairsm" mcp/sonarqube
   ```

   If this fails, your token or organization key may be incorrect.

5. **Completely restart Cursor**: Close all Cursor windows and reopen.

6. **Check Cursor logs**: Look for any additional error messages that might indicate the problem.

If the error persists after these steps, see the detailed troubleshooting section below.

## Multiple Docker Containers Running

If you see multiple `mcp/sonarqube` containers running in Docker Desktop, this indicates Cursor is repeatedly trying to connect but failing. This creates a new container each time:

**To fix:**

1. **Stop all SonarQube containers**:

   ```powershell
   docker ps --filter "ancestor=mcp/sonarqube" --format "{{.ID}}" | ForEach-Object { docker stop $_ }
   ```

2. **Run the diagnostic script** to identify the issue:

   ```powershell
   cd .cursor
   .\diagnose-sonarqube-mcp.ps1
   ```

3. **Fix the root cause** (usually missing/invalid credentials or environment variables not being passed correctly)

4. **Restart Cursor** completely after fixing the configuration

## Prerequisites

1. **Docker** - Ensure Docker is installed and running on your system
2. **SonarQube Access** - Either:
   - **SonarCloud Account** - You need access to the SonarCloud organization, OR
   - **Self-Hosted SonarQube Server** - A running SonarQube Server instance
3. **Personal User Token** - You'll need to generate a personal access token

> **Note**: This guide focuses on **SonarCloud** configuration. If you're using a **self-hosted SonarQube Server**, see `SONARQUBE_SELF_HOSTED.md` for configuration with `SONARQUBE_URL`.

## Step 1: Generate SonarCloud Token

**IMPORTANT**: You must generate a **Personal User Token**, not a project or global token. Project tokens will not work with the MCP server.

1. Go to [SonarCloud](https://sonarcloud.io)
2. Log in to your account
3. Click on your profile icon (top right)
4. Go to **My Account** → **Security**
5. Under **Generate Tokens**, enter a name (e.g., "Cursor MCP")
6. Click **Generate**
7. **Copy the token immediately** - you won't be able to see it again
8. **Verify it's a user token** - User tokens are the only type that works with MCP servers

## Step 2: Get Your Organization Key

From your SonarCloud URL: `https://sonarcloud.io/organizations/debonairsm/projects`

Your organization key is: **`debonairsm`**

## Step 3: Configure MCP Server in Cursor

### Option A: Using Cursor Settings UI (Recommended)

1. Open Cursor IDE
2. Go to **Settings** (Ctrl+,)
3. Navigate to **Tools & Integrations** → **MCP Servers**
4. Click **New MCP Server** or **Add Server**
5. Configure with the following:
   - **Name**: `sonarqube`
   - **Command**: `docker`
   - **Args**: `["run", "-i", "--name", "sonarqube-mcp-server", "--rm", "-e", "SONARQUBE_TOKEN", "-e", "SONARQUBE_ORG", "mcp/sonarqube"]`
   - **Note**: Must use a Personal User Token (NOT a project token - this causes "Client closed" errors)
   - **Environment Variables**:
     - `SONARQUBE_TOKEN`: `<your_token_from_step_1>`
     - `SONARQUBE_ORG`: `debonairsm`

### Option B: Automated Setup Script (Easiest)

Run the provided PowerShell script to automatically set up the configuration:

```powershell
cd .cursor
.\setup-sonarqube-mcp.ps1
```

The script will:

- Verify Docker is installed and running
- Create the configuration directory if needed
- Prompt for your SonarCloud token and organization
- Create or update `mcp.json` with the correct format
- Pull the Docker image
- Test the configuration

### Option C: Manual Configuration

1. Navigate to `%USERPROFILE%\.cursor\` (typically `C:\Users\<YourUsername>\.cursor\`)
2. Create or edit `mcp.json`
3. Add the following configuration:

```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "docker",
      "args": [
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
      ],
      "env": {
        "SONARQUBE_TOKEN": "<your_personal_user_token>",
        "SONARQUBE_ORG": "debonairsm"
      }
    }
  }
}
```

**Important Notes:**

- ⚠️ **CRITICAL**: Use a **Personal User Token** (NOT a project or global token - project tokens cause "Client closed" errors)
- Includes `--name sonarqube-mcp-server` as shown in official GitHub repository
- The `-i` flag is required for interactive/stdio mode
- Do not use quotes around the environment variable values unless they contain special characters
- Make sure there are no trailing commas in the JSON
- Reference: [Official GitHub Repo](https://github.com/SonarSource/sonarqube-mcp-server)

Replace `<your_personal_user_token>` with your actual Personal User Token generated in Step 1.

## Step 4: Restart Cursor

After configuring the MCP server, restart Cursor IDE to ensure the changes take effect.

## Step 5: Verify Setup

Once Cursor restarts, the SonarQube MCP server should be available. You can verify by:

- Checking if SonarQube-related tools/functions are available in the AI context
- The MCP server should appear in Cursor's MCP server list

## Troubleshooting

### "Client closed" Error

If you see "Client closed for command" in the logs, the Docker container starts but the stdio connection fails immediately. This usually means:

1. **Invalid or missing credentials** - The container can't authenticate and exits
2. **Environment variables not being passed** - Check your `env` section has real values

**Fix steps:**

1. **Verify your credentials** in `%USERPROFILE%\.cursor\mcp.json`:
   - `SONARQUBE_TOKEN` must be your actual token (not a placeholder)
   - `SONARQUBE_ORG` must match your SonarCloud organization

2. **Test the container manually**:

   ```powershell
   docker run -i --rm -e SONARQUBE_TOKEN="your_token" -e SONARQUBE_ORG="debonairsm" mcp/sonarqube
   ```

   If this exits immediately, your credentials are wrong.

3. **Check container logs** for error messages:

   ```powershell
   $id = docker run -d --rm -e SONARQUBE_TOKEN="your_token" -e SONARQUBE_ORG="debonairsm" mcp/sonarqube
   docker logs $id
   docker stop $id
   ```

4. **Clean up and restart**:
   - Stop all SonarQube containers
   - Restart Cursor completely
   - Check logs again

See `FIX_SONARQUBE_CLIENT_CLOSED.md` for detailed troubleshooting.

### "No server info found" Error

This error typically occurs when the MCP server configuration isn't being read correctly. Try these steps:

1. **Verify mcp.json location**: Ensure the file is in `%USERPROFILE%\.cursor\mcp.json` (not in the project directory)
2. **Check JSON syntax**: Validate your JSON at [jsonlint.com](https://jsonlint.com)
3. **Environment variables**: Ensure both `SONARQUBE_TOKEN` and `SONARQUBE_ORG` are set in the `env` section
4. **Docker image**: Pull the latest image: `docker pull mcp/sonarqube`
5. **Test docker command manually**:

   ```powershell
   docker run -i --rm -e SONARQUBE_TOKEN="your_token" -e SONARQUBE_ORG="debonairsm" mcp/sonarqube
   ```

6. **Restart Cursor completely**: Close all Cursor windows and restart

### Docker Not Running

- Ensure Docker Desktop is running
- Verify Docker is accessible from command line: `docker --version`
- On Windows, ensure Docker Desktop is running (not just installed)

### Token Issues

- Make sure the token is copied correctly (no extra spaces)
- Verify the token hasn't expired (tokens don't expire by default, but check your SonarCloud account)
- Test the token by visiting: `https://sonarcloud.io/api/authentication/validate`

### Organization Key

- Double-check the organization key matches your SonarCloud URL
- The organization key is case-sensitive
- It should match the organization in your SonarCloud dashboard URL

### MCP Server Not Appearing

- Check the `mcp.json` file syntax is valid JSON
- Ensure environment variables are set correctly (no quotes around values unless needed)
- Try restarting Cursor again
- Check Cursor's logs for any error messages
- Verify the configuration path: `%USERPROFILE%\.cursor\mcp.json`

## Additional Configuration

### Disable Telemetry (Optional)

If you want to disable telemetry collection, add this to your environment variables:

```json
"env": {
  "SONARQUBE_TOKEN": "<your_token>",
  "SONARQUBE_ORG": "debonairsm",
  "TELEMETRY_DISABLED": "true"
}
```

## Resources

- [SonarQube MCP Server Documentation](https://docs.sonarsource.com/sonarqube-mcp-server)
- [SonarCloud Dashboard](https://sonarcloud.io/organizations/debonairsm/projects)
