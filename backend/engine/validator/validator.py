from typing import Dict
# Simple validation of model
def validate(model: Dict) -> Dict:
    errors = []
    warnings = []
    if not model.get('tables'):
        errors.append('No tables found')
    for t in model.get('tables', []):
        if not t.get('columns') and not t.get('measures'):
            warnings.append(f'Empty table: {t.get('name')}')
    return {'valid': len(errors) == 0, 'errors': errors, 'warnings': warnings}
