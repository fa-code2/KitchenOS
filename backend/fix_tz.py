import os
import glob

for ext in ['**/*.py']:
    for filepath in glob.glob(ext, recursive=True):
        if 'venv' in filepath or '.venv' in filepath:
            continue
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        orig_content = content
        
        # Replace datetime.now(timezone.utc).replace(tzinfo=None) with datetime.now(timezone.utc).replace(tzinfo=None)
        # to match datetime.utcnow() naive behavior and avoid offset-naive/offset-aware subtraction errors.
        content = content.replace('datetime.now(timezone.utc).replace(tzinfo=None)', 'datetime.now(timezone.utc).replace(tzinfo=None)')
        
        # Also, fix any remaining double .replace if it happens
        content = content.replace('datetime.now(timezone.utc).replace(tzinfo=None).replace(tzinfo=None)', 'datetime.now(timezone.utc).replace(tzinfo=None)')

        if content != orig_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Fixed {filepath}')
