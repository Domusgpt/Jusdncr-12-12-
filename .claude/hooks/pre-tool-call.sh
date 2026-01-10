#!/bin/bash

# Claude Code Pre-Tool-Call Hook
# Runs before git push to verify build passes

# Only run for git push commands
if [[ "$CLAUDE_TOOL_NAME" == "Bash" ]] && [[ "$CLAUDE_TOOL_INPUT" == *"git push"* ]]; then
    echo "🔍 Pre-push verification: Running build check..."

    cd /home/user/Jusdncr-12-12-

    # Run build and capture output
    BUILD_OUTPUT=$(npm run build 2>&1)
    BUILD_EXIT=$?

    # Check for TypeScript errors
    if echo "$BUILD_OUTPUT" | grep -q "error TS"; then
        echo "❌ BUILD FAILED - TypeScript errors detected:"
        echo "$BUILD_OUTPUT" | grep "error TS" | head -20
        echo ""
        echo "⛔ Push blocked. Fix errors before pushing."
        exit 1
    fi

    if [ $BUILD_EXIT -ne 0 ]; then
        echo "❌ BUILD FAILED with exit code $BUILD_EXIT"
        echo "$BUILD_OUTPUT" | tail -30
        echo ""
        echo "⛔ Push blocked. Fix build errors before pushing."
        exit 1
    fi

    echo "✅ Build passed. Proceeding with push."
fi

exit 0
