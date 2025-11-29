# Verifying Cursor UI Configuration vs mcp.json

If you're using the Cursor UI to configure SonarQube MCP, here's how to verify it matches the required configuration:

## What Cursor UI Does

The Cursor UI (Settings → MCP Servers) writes to `%USERPROFILE%\.cursor\mcp.json`.

## Verify Your Configuration

1. **Check the actual mcp.json file**:
   - Open `%USERPROFILE%\.cursor\mcp.json` in a text editor
   - Verify it has the correct format

2. **Ensure the configuration matches this format**:

```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
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

## Critical Checks

### 1. Token Type

- The token must be a **Personal User Token**, not a Project Token
- Go to SonarCloud → My Account → Security
- Generate a new User Token if needed
- Replace the token in the UI or mcp.json

### 2. Docker Args Format

- Should NOT include `--init` or `--name`
- Should include `-i` flag for interactive mode
- Order: `["run", "-i", "--rm", "-e", "SONARQUBE_TOKEN", "-e", "SONARQUBE_ORG", "mcp/sonarqube"]`

### 3. Environment Variables

- Both `SONARQUBE_TOKEN` and `SONARQUBE_ORG` must be set
- Token must be your actual token (not placeholder)
- Organization must match your SonarCloud URL

## If UI Configuration Doesn't Match

If the UI-generated configuration doesn't match the required format:

1. **Edit mcp.json directly**:
   - Close Cursor
   - Edit `%USERPROFILE%\.cursor\mcp.json` manually
   - Use the format above
   - Save and reopen Cursor

2. **Or re-configure in UI**:
   - Remove the SonarQube server in Cursor UI
   - Add it again with correct settings
   - Make sure to use a Personal User Token

## Test Your Token

Before configuring, verify your token works:

```powershell
$token = "your_token_here"
curl -u "$token`:" "https://sonarcloud.io/api/authentication/validate"
```

If this fails, generate a new Personal User Token.
