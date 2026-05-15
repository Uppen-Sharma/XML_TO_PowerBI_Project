import xml.etree.ElementTree as ET
import json
import os
import zipfile


def parse_cognos_xml(xml_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()

    # BUG FIX: namespace was hardcoded to 17.4 — dynamically extract it from
    # the root tag so any Cognos schema version works.
    ns_uri = ''
    if root.tag.startswith('{'):
        ns_uri = root.tag.split('}')[0].strip('{')

    ns = {'cognos': ns_uri} if ns_uri else {}
    tag_prefix = 'cognos:' if ns_uri else ''

    items = root.findall(f'.//{tag_prefix}dataItem', ns)

    fields = []
    measures = []
    for d in items:
        name = d.attrib.get('name')
        if not name:
            continue
        text = ''.join(d.itertext()).strip()
        is_measure = (
            any(op in text for op in ['*', '+', '-', '/', '(', ')'])
            and not (f'[{name}]' in text and len(text.split()) == 1)
        )
        if is_measure:
            measures.append({'name': name, 'expression': text})
        else:
            dtype = (
                'Double' if name.lower() in ['quantity', 'unit sale price', 'unit price', 'cogs']
                else 'Int64' if name.lower() == 'year'
                else 'String'
            )
            fields.append({'name': name, 'dataType': dtype})

    if not any(f['name'] == 'Quarter' for f in fields):
        fields.append({'name': 'Quarter', 'dataType': 'String'})

    return fields, measures


def build_model(fields, measures):
    sales = {'name': 'Sales', 'columns': [], 'measures': []}

    for f in fields:
        col = {'name': f['name'], 'dataType': f['dataType']}
        if f['dataType'] == 'Int64':
            col['formatString'] = '0'
        if f['dataType'] == 'Double' and any(
            x in f['name'].lower() for x in ['unit sale price', 'unit price', 'cogs']
        ):
            col['formatString'] = 'Currency'
        sales['columns'].append(col)

    ref_map = {f'[{c["name"]}]': f"'Sales'[{c['name']}]" for c in sales['columns']}

    def convert(expr):
        for k, v in ref_map.items():
            expr = expr.replace(k, v)
        return expr

    for m in measures:
        expr = convert(m['expression'])
        fmt = 'Percent' if '%' in m['name'] else 'Currency'
        sales['measures'].append({'name': m['name'], 'expression': expr, 'formatString': fmt})

    dimDate = {
        'name': 'DimDate',
        'columns': [
            {'name': 'Year', 'dataType': 'Int64', 'formatString': '0'},
            {'name': 'Quarter', 'dataType': 'String'},
            {'name': 'QuarterName', 'dataType': 'String'},
        ],
        'measures': [],
    }
    dimOrder = {
        'name': 'DimOrderMethod',
        'columns': [
            {'name': 'Order method type', 'dataType': 'String'},
            {'name': 'OrderMethodKey', 'dataType': 'Int64'},
        ],
        'measures': [],
    }

    return {
        'name': 'Global Sales Semantic Model',
        'culture': 'en-US',
        'tables': [sales, dimDate, dimOrder],
        'relationships': [
            {
                'name': 'Sales_Year_to_DimDate',
                'fromTable': 'Sales', 'fromColumn': 'Year',
                'toTable': 'DimDate', 'toColumn': 'Year',
                'crossFilteringBehavior': 'OneDirection',
            },
            {
                'name': 'Sales_OrderMethod_to_DimOrderMethod',
                'fromTable': 'Sales', 'fromColumn': 'Order method type',
                'toTable': 'DimOrderMethod', 'toColumn': 'Order method type',
                'crossFilteringBehavior': 'OneDirection',
            },
        ],
    }


def build_report():
    return {
        'name': 'Global Sales Report',
        'pages': [{'name': 'ReportSection1', 'displayName': 'Page 1', 'visualContainers': []}],
        'version': '1.0',
    }


def generate_pbip(xml_path, output_folder='pbip-output', zip_name=None):
    fields, measures = parse_cognos_xml(xml_path)
    model = build_model(fields, measures)
    report = build_report()

    os.makedirs(output_folder, exist_ok=True)

    with open(os.path.join(output_folder, 'report.json'), 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=4)

    with open(os.path.join(output_folder, 'dataSources.json'), 'w', encoding='utf-8') as f:
        json.dump([], f, indent=4)

    sm_dir = os.path.join(output_folder, 'semantic-model')
    os.makedirs(sm_dir, exist_ok=True)
    # The output is Tabular Object Model JSON, so it must be saved as model.bim
    with open(os.path.join(sm_dir, 'model.bim'), 'w', encoding='utf-8') as f:
        json.dump(model, f, indent=4)

    stem = zip_name if zip_name else os.path.basename(output_folder)
    zip_path = os.path.join(os.path.dirname(output_folder), f'{stem}.zip')

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(output_folder):
            for file in files:
                fp = os.path.join(root, file)
                arc = os.path.relpath(fp, output_folder)
                z.write(fp, arcname=os.path.join(os.path.basename(output_folder), arc))

    return zip_path