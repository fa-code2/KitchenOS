import os
import glob

# Replace in all py files
for ext in ['**/*.py']:
    for filepath in glob.glob(ext, recursive=True):
        if 'venv' in filepath or '.venv' in filepath:
            continue
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        orig_content = content
        
        content = content.replace('gemini-3.7-flash', 'gemini-3.7-flash')
        content = content.replace('gemini-3.7-flash', 'gemini-3.7-flash')
        content = content.replace('gemini-3.7-flash', 'gemini-3.7-flash')

        if content != orig_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Fixed {filepath}')

# Also fix .env if it exists
if os.path.exists('.env'):
    with open('.env', 'r', encoding='utf-8') as f:
        content = f.read()
    orig_content = content
    content = content.replace('gemini-3.7-flash', 'gemini-3.7-flash')
    content = content.replace('gemini-3.7-flash', 'gemini-3.7-flash')
    content = content.replace('gemini-3.7-flash', 'gemini-3.7-flash')
    if content != orig_content:
        with open('.env', 'w', encoding='utf-8') as f:
            f.write(content)
        print('Fixed .env')
