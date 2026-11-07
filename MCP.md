# MCP — Model Context Protocol Tools for Cha Bazaar

> Status legend: **IMPLEMENTED** · **PROPOSED** · **TBD** (see [PRD.md](PRD.md)).
> Related: [AGENTS.md](AGENTS.md) · [TESTING.md](TESTING.md) · [INTEGRATIONS.md](INTEGRATIONS.md) · [AUTH_SECURITY.md](AUTH_SECURITY.md)

MCP servers give AI coding assistants extra tools, such as browsing GitHub, driving a browser, or reading a spreadsheet. **They are for development only; the shop itself doesn't use MCP.**

**Status: no MCP configuration is committed to this repository.** Everything below is PROPOSED. Per AGENTS.md rule 10, **nothing is installed automatically.** The owner adds a server only after reviewing it.

## 1. Recommended servers

| Server | Use in this project | Priority | Permissions it needs |
|---|---|---|---|
| **GitHub** | Read issues and PRs, open PRs for the plan items | High | Repo read; PR write on `sanjidmolik/tea_shop` only |
| **Playwright (browser automation)** | Run the E2E checks in TESTING.md §5; take screenshots at 390px and 1280px wide | High | Launch a local browser; access `localhost` |
| **Filesystem** (usually built into the coding tool) | Read and edit project files | High | This project folder only |
| **Google Sheets / Drive** | Inspect the test order Sheet during P-01 and P-13 | Medium (only after P-01) | **Read-only** on one test Sheet, never the live order Sheet |
| **Fetch / web** | Read docs (Bootstrap, Apps Script, WCAG) | Low | Outbound HTTPS |

### Not recommended

- Payment-provider MCPs (bKash, Nagad) and any tool with write access to live order data. These are too risky for an AI agent.
- Servers from unknown publishers. Check the publisher and source before adding anything.

## 2. Configuration placeholders

Example project-level `.mcp.json`, **not committed**. Replace the placeholders and keep tokens out of git.

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "<GITHUB_MCP_URL>",
      "headers": { "Authorization": "Bearer ${GITHUB_TOKEN}" }
    },
    "playwright": {
      "command": "npx",
      "args": ["<PLAYWRIGHT_MCP_PACKAGE>@<PINNED_VERSION>"]
    },
    "google-sheets": {
      "command": "<SHEETS_MCP_COMMAND>",
      "args": ["--read-only", "--sheet-id", "${TEST_SHEET_ID}"],
      "env": { "GOOGLE_APPLICATION_CREDENTIALS": "${GOOGLE_CREDENTIALS_PATH}" }
    }
  }
}
```

| Placeholder | Meaning | Value |
|---|---|---|
| `<GITHUB_MCP_URL>` | URL of the GitHub MCP server you choose | TBD |
| `${GITHUB_TOKEN}` | Fine-grained token limited to this repo | Set in your shell, never committed |
| `<PLAYWRIGHT_MCP_PACKAGE>@<PINNED_VERSION>` | Playwright MCP package, pinned to an exact version | TBD |
| `<SHEETS_MCP_COMMAND>` | Sheets MCP server command | TBD |
| `${TEST_SHEET_ID}` | ID of a **test copy** of the order Sheet | TBD |
| `${GOOGLE_CREDENTIALS_PATH}` | Service-account key with read-only access to the test Sheet | TBD; keep outside the repo |

Add `.mcp.json` to `.gitignore` if it ever holds real values (`.gitignore` doesn't exist yet; creating it is TBD).

## 3. Permission rules for agents using MCP

1. Read-only by default. Write tools need an explicit owner request in the current conversation.
2. Never point an MCP tool at the live order Sheet or at customer data.
3. GitHub: work only on the assigned branch. No merges, no force-push, no comments unless asked (AGENTS.md §1 rule 9).
4. Browser automation: `localhost` or the deployed site only. Don't submit real orders to the live endpoint; use the test deployment.
5. Log which MCP tools were used in the PR description.

## 4. Status

| Item | Status |
|---|---|
| MCP config in the repo | None |
| Servers used while building this project | A GitHub MCP and a headless browser were used by the coding assistant during development. This isn't part of the repo and needs no setup |
| Owner decision on which servers to adopt | TBD |
| Local alternative for testing the order server | `npm run serve` runs the real `Code.gs` on simulated Google services, so no Sheets MCP is needed for development |
