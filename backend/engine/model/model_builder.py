from typing import Dict
from ..parser.cognos_parser import parse
from ..translator.dax_engine import translate

# Classify items as dimension or measure
def classify_item(item: Dict) -> str:
    expr = item.get('expression', '')
    # if there's an aggregate or arithmetic operator, treat as measure
    if 'aggregate(' in expr.lower() or any(op in expr for op in ['*','+','-','/']):
        return 'measure'
    return 'dimension'

# Infer basic data type
def infer_type(name: str) -> str:
    n = name.lower() if name else ''
    if 'year' in n or 'id' in n:
        return 'Int64'
    if any(x in n for x in ['price','amount','revenue','cost','quantity']):
        return 'Double'
    return 'String'

# Build basic semantic model from parsed Cognos metadata
def build_model(metadata: Dict) -> Dict:
    tables = []
    for q in metadata['queries']:
        cols = []
        meas = []
        for item in q['data_items']:
            if classify_item(item) == 'measure':
                meas.append({
                    'name': item['name'],
                    'expression': translate(item['expression'], table=q['name'], model=metadata)
                })
            else:
                cols.append({
                    'name': item['name'],
                    'dataType': infer_type(item['name'])
                })
        tables.append({'name': q['name'], 'columns': cols, 'measures': meas})
    return {'name': metadata['report_name'], 'tables': tables, 'relationships': []}
