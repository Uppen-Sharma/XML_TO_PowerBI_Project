from typing import List, Dict
# Simple auto-detection of relationships via matching column names

def detect_relationships(model: Dict) -> List[Dict]:
    if 'tables' not in model:
        return []
    relationships = []
    tables = model['tables']
    for i, fact in enumerate(tables):
        for j, dim in enumerate(tables):
            if i == j:
                continue
            common = set([c['name'] for c in fact['columns']]) & set([c['name'] for c in dim['columns']])
            for col in common:
                relationships.append({
                    'fromTable': fact['name'],
                    'fromColumn': col,
                    'toTable': dim['name'],
                    'toColumn': col
                })
    return relationships
