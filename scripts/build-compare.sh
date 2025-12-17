#!/bin/bash
# Build both versions for comparison on GitHub Pages
# Usage: ./scripts/build-compare.sh

set -e

MAIN_BRANCH="main"
FEATURE_BRANCH="claude/enhanced-choreography-engine-DcgEQ"
OUTPUT_DIR="dist-compare"

echo "🔨 Building comparison deployment..."

# Clean output
rm -rf $OUTPUT_DIR
mkdir -p $OUTPUT_DIR

# Store current branch
CURRENT_BRANCH=$(git branch --show-current)

# Build main version
echo "📦 Building main branch (original)..."
git stash --include-untracked || true
git checkout $MAIN_BRANCH
npm install
npm run build
mv dist $OUTPUT_DIR/original

# Build feature version
echo "📦 Building feature branch (enhanced)..."
git checkout $FEATURE_BRANCH
git stash pop || true
npm install
npm run build
mv dist $OUTPUT_DIR/enhanced

# Create index page for comparison
cat > $OUTPUT_DIR/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>jusDNCE - Version Comparison</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Rajdhani', sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 2rem;
      background: linear-gradient(90deg, #00ffff, #ff00ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .versions {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    .version-card {
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 1rem;
      padding: 2rem 3rem;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
      text-decoration: none;
      color: white;
    }
    .version-card:hover {
      border-color: #8b5cf6;
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3);
    }
    .version-card h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .version-card p { opacity: 0.7; font-size: 0.9rem; }
    .original { border-color: rgba(255, 0, 255, 0.3); }
    .enhanced { border-color: rgba(0, 255, 255, 0.3); }
  </style>
</head>
<body>
  <h1>jusDNCE Version Comparison</h1>
  <div class="versions">
    <a href="./original/" class="version-card original">
      <h2>🎵 Original</h2>
      <p>Real-time reactive choreography</p>
    </a>
    <a href="./enhanced/" class="version-card enhanced">
      <h2>🚀 Enhanced</h2>
      <p>Pre-analyzed choreography + Direct export</p>
    </a>
  </div>
</body>
</html>
EOF

# Return to original branch
git checkout $CURRENT_BRANCH

echo ""
echo "✅ Build complete!"
echo "📁 Output: $OUTPUT_DIR/"
echo "   - $OUTPUT_DIR/index.html (comparison page)"
echo "   - $OUTPUT_DIR/original/ (main branch build)"
echo "   - $OUTPUT_DIR/enhanced/ (feature branch build)"
echo ""
echo "To deploy to GitHub Pages:"
echo "  npx gh-pages -d $OUTPUT_DIR"
