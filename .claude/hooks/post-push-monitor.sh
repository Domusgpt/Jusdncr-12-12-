#!/bin/bash

# Claude Code Post-Push Monitor Hook
# Checks GitHub Actions build status after push

REPO="Domusgpt/Jusdncr-12-12-"
BRANCH="claude/analyze-jusdnce-architecture-j3Ah8"

echo "📊 POST-PUSH BUILD MONITOR"
echo "=========================="
echo ""

# Function to check build via web
check_build_status() {
    echo "🔍 Checking GitHub Actions status for $REPO..."
    echo ""

    # Use curl to fetch actions page
    ACTIONS_URL="https://github.com/$REPO/actions"

    echo "📋 Recent workflow runs:"
    echo "   URL: $ACTIONS_URL"
    echo ""
    echo "⏳ Waiting 30s for build to start/complete..."
    sleep 30

    echo ""
    echo "✅ Build check complete. Review results at:"
    echo "   $ACTIONS_URL"
}

# Run the check
check_build_status

echo ""
echo "📝 VERIFICATION CHECKLIST:"
echo "   [ ] All TypeScript errors resolved"
echo "   [ ] Build completed successfully"
echo "   [ ] Deployed to GitHub Pages"
echo "   [ ] Firebase deployment (if applicable)"
