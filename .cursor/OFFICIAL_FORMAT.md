# Official SonarQube MCP Configuration (From GitHub)

Based on the official [SonarSource/sonarqube-mcp-server](https://github.com/SonarSource/sonarqube-mcp-server) repository, here's the exact configuration format:

## For SonarCloud

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
        "SONARQUBE_ORG": "<your_org_key>"
      }
    }
  }
}
```

## For Self-Hosted SonarQube Server

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
        "SONARQUBE_URL",
        "mcp/sonarqube"
      ],
      "env": {
        "SONARQUBE_TOKEN": "<your_personal_user_token>",
        "SONARQUBE_URL": "<your_server_url>"
      }
    }
  }
}
```

## Critical Requirements

1. **Token MUST be a Personal User Token** - NOT a project token or global token
   - For SonarCloud: Generate from My Account → Security
   - For SonarQube Server: Must be a USER token type
   - ⚠️ Project tokens will NOT work and cause "Client closed" errors

2. **Docker Args Format**:
   - Includes `--name sonarqube-mcp-server` (from official docs)
   - Uses `-i` flag for interactive/stdio mode
   - Uses `--rm` to auto-remove containers
   - Environment variables passed via `-e` flags

3. **Environment Variables**:
   - `SONARQUBE_TOKEN`: Your Personal User Token
   - `SONARQUBE_ORG`: Your organization key (SonarCloud only)
   - `SONARQUBE_URL`: Your server URL (Self-hosted only)

## Why "Client Closed" Happens

According to the official documentation:

- **Project tokens will NOT work** - only USER tokens
- Invalid credentials cause the container to exit immediately
- This closes the stdio connection, showing "Client closed"

## Verify Your Token Type

The token must be:

- ✅ **USER token** (Personal User Token) - This works
- ❌ **Project token** - This will NOT work
- ❌ **Global token** - This will NOT work

Check in SonarCloud/SonarQube:

- My Account → Security → Tokens
- Verify the token type is "User Token"

## Reference

- Official Repo: <https://github.com/SonarSource/sonarqube-mcp-server>
- Official Docs: <https://docs.sonarsource.com/sonarqube-mcp-server>
