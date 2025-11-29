# CRITICAL: SonarQube MCP Configuration Fix

Based on the official SonarSource documentation, here are the critical fixes needed:

## Key Issues Found

1. **Token Type**: Must use a **Personal User Token**, NOT a project or global token - THIS IS CRITICAL
2. **Docker Args**: According to official GitHub repo, should include `--name` flag (but can cause issues with multiple containers)
3. **Configuration Format**: Must match official SonarSource GitHub repository exactly

## Correct Configuration

Your `%USERPROFILE%\.cursor\mcp.json` should be:

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
        "SONARQUBE_TOKEN": "your_personal_user_token_here",
        "SONARQUBE_ORG": "debonairsm"
      }
    }
  }
}
```

**Note**: The official GitHub repo shows `--name sonarqube-mcp-server` in the args. However, if you experience container name conflicts, you can remove the `--name` flag - both formats work.

## Changes Based on Official GitHub Repo

1. ✅ Following official format from <https://github.com/SonarSource/sonarqube-mcp-server>
2. ✅ Includes `--name sonarqube-mcp-server` as shown in official docs
3. ✅ **CRITICAL**: Must use Personal User Token (not project token)
4. ✅ Format: `["run", "-i", "--name", "sonarqube-mcp-server", "--rm", "-e", "SONARQUBE_TOKEN", "-e", "SONARQUBE_ORG", "mcp/sonarqube"]`

## Steps to Fix

1. **Verify Token Type** (CRITICAL):
   - Go to SonarCloud → My Account → Security
   - Make sure you're generating a **User Token**, not a Project Token
   - If you used a Project Token, it won't work - generate a new User Token
   - **This is the #1 cause of "Client closed" errors**

2. **Update Configuration**:
   - Edit `%USERPROFILE%\.cursor\mcp.json`
   - Use the exact format above
   - Replace `your_personal_user_token_here` with your actual Personal User Token

3. **Stop All Containers**:

   ```powershell
   docker ps --filter "ancestor=mcp/sonarqube" --format "{{.ID}}" | ForEach-Object { docker stop $_ }
   ```

4. **Restart Cursor Completely**:
   - Close all Cursor windows
   - Wait a few seconds
   - Reopen Cursor

5. **Verify**:
   - Check Cursor's MCP logs
   - Should no longer see "Client closed" errors
   - Server should appear in MCP server list

## Self-Hosted SonarQube Server?

If you're using a **self-hosted SonarQube Server** (not SonarCloud), you need `SONARQUBE_URL` instead of `SONARQUBE_ORG`. See `SONARQUBE_SELF_HOSTED.md` for the correct configuration.

## Reference

- Official Docs: <https://docs.sonarsource.com/sonarqube-mcp-server>
- Environment Variables: <https://docs.sonarsource.com/sonarqube-mcp-server/build-and-configure/environment-variables>
