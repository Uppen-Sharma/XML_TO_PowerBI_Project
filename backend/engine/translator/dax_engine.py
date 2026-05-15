# DAX translation engine

def translate(expr: str, table: str = None, model: dict = None) -> str:
    'Simple rule-based translation of Cognos expression to DAX.'
    dax = expr
    # wrap references of form [Column] into 'table'[Column] if table provided
    if table:
        import re
        dax = re.sub(r'\[(.*?)\]', lambda m: "'{}'[{}]".format(table, m.group(1)), dax)
    dax = dax.replace('/', ' DIVIDE ')
    dax = dax.replace('aggregate(', 'SUM(')
    return dax
