import glob

paths = glob.glob('../frontend/app/**/*.tsx', recursive=True)
c = 0
for p in paths:
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    if '"http://localhost:8000"' in content:
        content = content.replace('"http://localhost:8000"', '"http://localhost:8080"')
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)
        c += 1
print(f'Replaced {c} files')
