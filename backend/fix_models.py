import os
import glob

# Replace in all py files
for ext in ['**/*.py']:
    for filepath in glob.glob(ext, recursive=True):
        if 'venv' in filepath or '.venv' in filepath:
            continue
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'gemini-3.7-flash' in content:
            new_content = content.replace('gemini-3.7-flash', 'gemini-3.7-flash')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Fixed {filepath}')

# Also fix .env if it exists
if os.path.exists('.env'):
    with open('.env', 'r', encoding='utf-8') as f:
        content = f.read()
    if 'gemini-3.7-flash' in content:
        new_content = content.replace('gemini-3.7-flash', 'gemini-3.7-flash')
        with open('.env', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Fixed .env')
