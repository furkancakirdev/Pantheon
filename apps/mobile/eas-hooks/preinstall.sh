#!/bin/bash
# Force pnpm instead of npm
set -e

echo "🔧 Setting up pnpm for EAS Build..."

# Install pnpm globally if not available
if ! command -v pnpm &> /dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm
fi

# Create npm wrapper that uses pnpm
echo "Creating npm wrapper..."
cat > /usr/local/bin/npm << 'EOF'
#!/bin/bash
pnpm "$@"
EOF
chmod +x /usr/local/bin/npm

echo "✅ pnpm configured successfully"
