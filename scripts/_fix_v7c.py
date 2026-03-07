import re

path = 'src/components/CompleteMFAFlowV7.tsx'
with open(path, 'r') as f:
    content = f.read()

# Remove duplicate consecutive eslint-disable-next-line comments
# Pattern: two identical disable comments in a row - keep only the second
pattern = r'(\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n)(\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n)'
before = len(re.findall(pattern, content))
content = re.sub(pattern, r'\2', content)
after_count = len(re.findall(pattern, content))
print(f"Removed {before} duplicate disable comment(s), {after_count} remaining")

with open(path, 'w') as f:
    f.write(content)
print("Done")
