import os, glob
paths = glob.glob('../frontend/app/**/*.tsx', recursive=True)
for p in paths:
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = content.replace('"http://localhost:8080"', '(typeof window !== "undefined" && window.location.hostname !== "localhost" ? "http://" + window.location.hostname + ":8000" : "http://localhost:8000")')
    if new_content != content:
        with open(p, 'w', encoding='utf-8') as f:
            f.write(new_content)
