# SonarQube MCP Configuration for Self-Hosted Server

If you're using a **self-hosted SonarQube Server** (not SonarCloud), you need to use `SONARQUBE_URL` instead of `SONARQUBE_ORG`.

## Configuration for Self-Hosted SonarQube Server

Your `%USERPROFILE%\.cursor\mcp.json` should be:

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
        "SONARQUBE_URL",
        "mcp/sonarqube"
      ],
      "env": {
        "SONARQUBE_TOKEN": "your_personal_user_token_here",
        "SONARQUBE_URL": "http://your-sonarqube-server:9000"
      }
    }
  }
}
```

## Key Differences

| Setting | SonarCloud | Self-Hosted Server |
|---------|------------|-------------------|
| **Environment Variable** | `SONARQUBE_ORG` | `SONARQUBE_URL` |
| **Value** | Organization key (e.g., `debonairsm`) | Server URL (e.g., `http://localhost:9000`) |
| **Token Type** | Personal User Token | Personal User Token |

## Steps to Configure

1. **Get Your SonarQube Server URL**:
   - Usually `http://localhost:9000` for local installations
   - Or your server's domain/IP if remote (e.g., `https://sonarqube.company.com`)

2. **Generate a Personal User Token**:
   - Log in to your SonarQube Server
   - Go to **My Account** → **Security**
   - Generate a new User Token

3. **Update Your Configuration**:
   - Edit `%USERPROFILE%\.cursor\mcp.json`
   - Use the format above with `SONARQUBE_URL` instead of `SONARQUBE_ORG`

4. **Restart Cursor** completely

## Example URLs

- Local: `http://localhost:9000`
- Remote HTTP: `http://sonarqube.company.com:9000`
- Remote HTTPS: `https://sonarqube.company.com`
- With custom port: `http://192.168.1.100:9000`

## Troubleshooting

- **Make sure the URL is accessible** from where Docker is running
- **Check if it's HTTP or HTTPS** - use the correct protocol
- **Verify the port** - default is 9000, but might be different
- **Test the URL** in your browser before configuring
