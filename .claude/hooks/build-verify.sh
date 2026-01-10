#!/bin/bash

# =============================================================================
# CLAUDE BUILD VERIFICATION HOOK
# =============================================================================
# MUST run before every git push to verify all build outputs.
# =============================================================================

REPO_DIR="/home/user/Jusdncr-12-12-"
REPO="Domusgpt/Jusdncr-12-12-"
GH_BIN="$HOME/.local/bin/gh"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo "=============================================="
echo "   CLAUDE BUILD VERIFICATION"
echo "=============================================="

# -----------------------------------------------------------------------------
# LOCAL BUILD
# -----------------------------------------------------------------------------
echo -e "\n${CYAN}[1/4] LOCAL BUILD${NC}"
echo "-------------------------------------------"

cd "$REPO_DIR"
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT=$?

if echo "$BUILD_OUTPUT" | grep -q "error TS"; then
    echo -e "${RED}❌ TYPESCRIPT ERRORS:${NC}"
    echo "$BUILD_OUTPUT" | grep "error TS"
    echo -e "\n${RED}⛔ FIX BEFORE PUSHING${NC}"
    exit 1
fi

if [ $BUILD_EXIT -ne 0 ]; then
    echo -e "${RED}❌ BUILD FAILED${NC}"
    echo "$BUILD_OUTPUT" | tail -20
    exit 1
fi

echo -e "${GREEN}✅ BUILD PASSED${NC}"
echo "$BUILD_OUTPUT" | grep "modules transformed"

# -----------------------------------------------------------------------------
# GIT STATUS
# -----------------------------------------------------------------------------
echo -e "\n${CYAN}[2/4] GIT STATUS${NC}"
echo "-------------------------------------------"
git status --short
BRANCH=$(git branch --show-current)
echo "Branch: $BRANCH"

# -----------------------------------------------------------------------------
# GITHUB ACTIONS (via web)
# -----------------------------------------------------------------------------
echo -e "\n${CYAN}[3/4] GITHUB ACTIONS${NC}"
echo "-------------------------------------------"
echo "URL: https://github.com/$REPO/actions"
echo ""
echo "Recent runs:"
# Use curl to fetch actions page and extract run info
curl -s "https://api.github.com/repos/$REPO/actions/runs?per_page=5" 2>/dev/null | \
    grep -E '"conclusion"|"name"|"head_branch"' | head -15 || \
    echo "  (API rate limited - check manually)"

# -----------------------------------------------------------------------------
# FIREBASE STATUS
# -----------------------------------------------------------------------------
echo -e "\n${CYAN}[4/4] FIREBASE${NC}"
echo "-------------------------------------------"
if [ -f "$REPO_DIR/.firebaserc" ]; then
    PROJECT=$(grep -o '"default": "[^"]*"' "$REPO_DIR/.firebaserc" | cut -d'"' -f4)
    echo "Project: $PROJECT"
    echo "Console: https://console.firebase.google.com/project/$PROJECT/hosting"
else
    echo "Not configured"
fi

# -----------------------------------------------------------------------------
# SUMMARY
# -----------------------------------------------------------------------------
echo ""
echo "=============================================="
echo -e "${GREEN}✅ READY TO PUSH${NC}"
echo "=============================================="
echo ""
echo "After pushing, verify at:"
echo "  - GitHub: https://github.com/$REPO/actions"
echo "  - Pages:  https://domusgpt.github.io/Jusdncr-12-12-/"
echo ""
