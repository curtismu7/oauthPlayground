#!/bin/bash
# Find JSX components used but not defined/imported in pages
SKIP="React|Fragment|Suspense|StrictMode|Router|Route|Routes|BrowserRouter|Link|NavLink|Navigate|ThemeProvider|ErrorBoundary|Provider|Redirect|FlowHeader|CollapsibleHeader|WorkerTokenSectionV8|MDIIcon|CodeBlockWithCopy|StrictMode|PingOneApplicationConfig|ConfigurationURIChecker"

for f in src/pages/*.tsx; do
  fname=$(basename "$f")
  # Get all JSX component names (uppercase tags)
  used=$(grep -oE '<[A-Z][A-Za-z0-9]+' "$f" | sed 's/<//' | sort -u)
  for comp in $used; do
    # Skip known built-ins and already-handled
    if echo "$comp" | grep -qE "^($SKIP)$"; then continue; fi
    # Check if it's defined in this file: import, const X, function X, class X, or styled
    if ! grep -qE "import.*\b${comp}\b|^(export )?(const|function|class) ${comp}[ =<(]" "$f"; then
      echo "$fname: <$comp>"
    fi
  done
done
