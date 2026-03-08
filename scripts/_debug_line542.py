with open('src/components/WorkerTokenRequestModal.tsx') as f:
    lines = f.readlines()
for i, l in enumerate(lines[538:548], 539):
    print(repr((i, l)))
