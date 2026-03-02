



cat > .gitignore << 'EOF'
*.json
*.csv
*.zip
*export*
*backup*
*deletions*
*dedup*
*organized*
.DS_Store
Thumbs.db
*.log
node_modules/
.vercel/
EOF

cat > vercel.json << 'EOF'
{
  "cleanUrls": true,
  "trailingSlash": false
}
EOF

git init
git add index.html .gitignore vercel.json
git commit -m "Initial commit: Bitwarden Vault Deduper (static)"