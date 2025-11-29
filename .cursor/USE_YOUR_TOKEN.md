# Use Your User Token

I can see you have User Tokens available in SonarCloud:

1. **cursor-mcp** - Created Nov 28, 2025, last used < 1 hour ago
2. **dev** - Just created (Nov 29, 2025)

Both are User Tokens, which is correct!

## Next Steps

### Option 1: Update Cursor UI Configuration

1. In Cursor, go to Settings → MCP Servers → SonarQube
2. Click the trash icon next to the masked token to clear it
3. Enter your User Token (either "cursor-mcp" token or the new "dev" token value)
4. Make sure `sonarqube.org` is set to: `debonairsm`
5. Leave `sonarqube.url` empty (for SonarCloud)
6. Click **Save**

### Option 2: Update mcp.json Directly

1. Open `%USERPROFILE%\.cursor\mcp.json`
2. Find the `SONARQUBE_TOKEN` value in the `env` section
3. Replace it with your User Token (the "dev" token you just generated, or use the existing "cursor-mcp" token)
4. Save the file
5. Restart Cursor completely

## Important

- ✅ Both tokens are User Tokens - either one will work
- ✅ Make sure you copy the token value exactly (no spaces, no quotes)
- ⚠️ The token value shown in the screenshot starts with `654b23a42733c54ddd4bfd7a7d3cb7b57233bdf1`

## After Updating

1. **Stop all existing containers**:

   ```powershell
   docker ps --filter "ancestor=mcp/sonarqube" --format "{{.ID}}" | ForEach-Object { docker stop $_ }
   ```

2. **Restart Cursor completely** (close all windows)

3. **Check the MCP logs** - should no longer see "Client closed" errors

The configuration format should match the official GitHub repo (see `OFFICIAL_FORMAT.md`).
