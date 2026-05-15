import re
from typing import Dict

# Validate DAX expression
def validate_dax(dax: str, model: Dict) -> Dict:
    errors = []
    warnings = []
    
    if not dax or dax.strip() == "":
        return {'valid': False, 'issues': ['Expression is empty']}

    # Check parentheses balance
    if dax.count('(') != dax.count(')'):
        errors.append('Mismatched parentheses: Check if all opened brackets are closed.')
        
    # Check for valid table/column references: 'Table'[Column]
    pattern = r"'(.*?)'\[(.*?)\]"
    matches = re.findall(pattern, dax)
    
    # Also check for naked column references if we are in a single-table context 
    # (though best practice is always fully qualified)
    
    for table_name, col_name in matches:
        table_found = next((t for t in model.get('tables', []) if t['name'] == table_name), None)
        if not table_found:
            errors.append(f"Table reference error: Table '{table_name}' does not exist in the model.")
            continue
            
        col_found = next((c for c in table_found.get('columns', []) if c['name'] == col_name), None)
        # Also check measures in that table
        meas_found = next((m for m in table_found.get('measures', []) if m['name'] == col_name), None)
        
        if not col_found and not meas_found:
            errors.append(f"Field reference error: '{col_name}' was not found in table '{table_name}'.")

    # Syntax warnings
    if '/' in dax and 'DIVIDE' not in dax.upper():
        warnings.append("Performance Hint: Use DIVIDE(a, b) instead of 'a / b' to handle division-by-zero errors safely.")

    # Combine errors and warnings into 'issues' for the frontend
    issues = errors + warnings
    
    return {
        'valid': len(errors) == 0,
        'issues': issues,
        'errors': errors,
        'warnings': warnings
    }
