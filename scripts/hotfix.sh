#!/bin/bash
# TIMMY Hotfix & Upgrade Script
# Automates validation, patch version bumping, merging to main, and pushing.
set -e

# Color helpers
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}🚀 Preparing TIMMY TUI Hotfix / Upgrade Release${NC}"
echo -e "${CYAN}====================================================${NC}"

# 1. Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "antigravity/polish-tui-v2" ]; then
  echo -e "${RED}✕ Error: You must be on the dev branch (antigravity/polish-tui-v2) to start a hotfix.${NC}"
  echo -e "Currently on: ${RED}$CURRENT_BRANCH${NC}"
  echo -e "Switch to dev branch first: ${CYAN}git checkout antigravity/polish-tui-v2${NC}"
  exit 1
fi

# 2. Check for working tree clean
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}✕ Error: You have uncommitted changes in your working tree.${NC}"
  echo -e "Please commit or stash them before running the hotfix release script."
  exit 1
fi

# 3. Pull latest remote state
echo -e "\n${CYAN}[1/6] Pulling latest remote changes...${NC}"
git fetch origin
git pull origin antigravity/polish-tui-v2

# 4. Run full test suite and build
echo -e "\n${CYAN}[2/6] Running verification suite...${NC}"
npm install
npm run build
npm test
npm run timmy:ui-smoke
./scripts/security-scan.sh

# 5. Bump patch version
echo -e "\n${CYAN}[3/6] Bumping version patch...${NC}"
npm version patch --no-git-tag-version
NEW_VERSION=$(node -e "console.log(require('./package.json').version)")
echo -e "${GREEN}✓ Bumped local package.json version to v$NEW_VERSION${NC}"

# 6. Commit version bump
git add package.json package-lock.json
git commit -m "chore: bump version to v$NEW_VERSION for hotfix release" || true

# 7. Merge to main branch
echo -e "\n${CYAN}[4/6] Merging hotfix to main...${NC}"
git checkout main
git pull origin main
git merge --no-ff --no-edit antigravity/polish-tui-v2

# 8. Push main and dev branch to remote
echo -e "\n${CYAN}[5/6] Pushing changes to remote origin...${NC}"
git push origin main
git checkout antigravity/polish-tui-v2
git push origin antigravity/polish-tui-v2

echo -e "\n${CYAN}[6/6] Verifying npm packaging output...${NC}"
npm pack --dry-run

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}🟢 TIMMY HOTFIX / UPGRADE PREPARED SUCCESSFULLY!${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "Version ${CYAN}v$NEW_VERSION${NC} has been merged to main and pushed to GitHub."
echo -e "To publish this release to npm, run:"
echo -e "  ${GREEN}npm publish --access public${NC}"
echo -e "${GREEN}====================================================${NC}"
