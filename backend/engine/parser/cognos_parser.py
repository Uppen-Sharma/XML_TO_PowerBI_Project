import xml.etree.ElementTree as ET
import os

NS = {'c': 'http://developer.cognos.com/schemas/report/17.4/'}

# Parse Cognos XML into structured metadata
def parse(xml_path: str) -> dict:
    if not os.path.exists(xml_path):
        raise FileNotFoundError(f"XML file not found: {xml_path}")
    
    if os.path.getsize(xml_path) == 0:
        raise ValueError("XML file is empty")

    try:
        tree = ET.parse(xml_path)
    except ET.ParseError as e:
        raise ValueError(f"XML Parse Error: {str(e)}")
        
    root = tree.getroot()
    # Handle both attribute and element for report name
    report_name = root.attrib.get('name')
    if not report_name:
        rn_elem = root.find('.//c:reportName', NS)
        if rn_elem is not None:
            report_name = rn_elem.text
    if not report_name:
        report_name = os.path.basename(xml_path).replace('.xml', '')

    queries = []
    query_elements = root.findall('.//c:query', NS)
    
    for q in query_elements:
        qi = {
            'name': q.attrib.get('name', 'Unnamed Query'),
            'data_items': [],
            'filters': [],
            'joins': []
        }
        
        for item in q.findall('.//c:dataItem', NS):
            name = item.attrib.get('name')
            # Extract text from the expression element or the dataItem itself
            expr_elem = item.find('./c:expression', NS)
            if expr_elem is not None:
                expr = ''.join(expr_elem.itertext()).strip()
            else:
                expr = ''.join(item.itertext()).strip()
                
            qi['data_items'].append({'name': name, 'expression': expr})
        
        queries.append(qi)
        
    if not queries:
        # Try finding queries without namespace if c:query failed
        query_elements_no_ns = root.findall('.//query')
        for q in query_elements_no_ns:
            qi = {
                'name': q.attrib.get('name', 'Unnamed Query'),
                'data_items': [],
                'filters': [],
                'joins': []
            }
            for item in q.findall('.//dataItem'):
                name = item.attrib.get('name')
                expr = ''.join(item.itertext()).strip()
                qi['data_items'].append({'name': name, 'expression': expr})
            queries.append(qi)

    return {'report_name': report_name, 'queries': queries}
