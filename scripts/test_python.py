#!/usr/bin/env python3
print("Python is working!")
print("Testing file access...")

import os
src_dir = "/Users/cmuir/P1Import-apps/oauth-playground/src"
count = 0
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.tsx'):
            count += 1
            if count <= 5:
                print(f"Found: {file}")

print(f"Total .tsx files: {count}")
print("✅ Test complete!")
