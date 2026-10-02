import os
import glob
import re

for ext in ['**/*.py']:
    for filepath in glob.glob(ext, recursive=True):
        if 'venv' in filepath or '.venv' in filepath:
            continue
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        orig_content = content
        
        # Fix datetime.now(timezone.utc).replace(tzinfo=None) -> datetime.now(timezone.utc).replace(tzinfo=None)
        if 'datetime.now(timezone.utc).replace(tzinfo=None)' in content:
            if 'from datetime import datetime, timedelta' in content and 'timezone' not in content:
                content = content.replace('from datetime import datetime, timedelta', 'from datetime import datetime, timedelta, timezone')
            elif 'from datetime import datetime\n' in content and 'timezone' not in content:
                content = content.replace('from datetime import datetime\n', 'from datetime import datetime, timezone\n')
            elif 'from datetime import datetime' in content and 'timezone' not in content:
                content = content.replace('from datetime import datetime', 'from datetime import datetime, timezone')
            content = content.replace('datetime.now(timezone.utc).replace(tzinfo=None)', 'datetime.now(timezone.utc).replace(tzinfo=None)')
        
        # Fix Pydantic Config
        if 'class Config:' in content:
            if 'from pydantic import ' in content and 'ConfigDict' not in content:
                content = re.sub(r'(from pydantic import.*?)(?=\n)', r'\1, ConfigDict', content, count=1)
            
            content = content.replace('class Config:\n        from_attributes = True', 'model_config = ConfigDict(from_attributes=True)')
            content = content.replace('class Config:\n        orm_mode = True', 'model_config = ConfigDict(from_attributes=True)')

        # Fix Pydantic Field json_schema_extra={"example": ...
        content = re.sub(r'example=([^},\)]+)', r'json_schema_extra={"example": \1}', content)

        # Fix Pillow getdata
        content = content.replace('small.getdata()', 'small.getdata()') # wait, pillow 11+ get_flattened_data
        
        # Some custom fix for getdata:
        if '.getdata()' in content and 'get_flattened_data' not in content:
            content = content.replace('.getdata()', '.get_flattened_data()')

        if content != orig_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Fixed {filepath}')
