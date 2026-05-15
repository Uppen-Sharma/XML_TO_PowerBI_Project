import json
import os
import zipfile
import shutil

# Generate a Power BI Project (PBIP) from a model.
# A PBIP structure typically includes:
# - <Name>.pbip (file)
# - <Name>.Dataset/ (folder)
#   - definition.pbi
#   - model.bim
# - <Name>.Report/ (folder)
#   - report.json

def generate_pbip_from_model(model: dict, output_folder: str = 'pbip-output') -> str:
    # Ensure fresh output folder
    if os.path.exists(output_folder):
        shutil.rmtree(output_folder)
    os.makedirs(output_folder, exist_ok=True)
    
    # Use a clean name for files/folders
    raw_name = model.get('name', 'PBI_Accelerator_Project')
    model_name = "".join([c if c.isalnum() or c in (' ', '_', '-') else '_' for c in raw_name]).strip()
    if not model_name:
        model_name = "PBI_Project"

    dataset_dir = os.path.join(output_folder, f"{model_name}.Dataset")
    report_dir = os.path.join(output_folder, f"{model_name}.Report")
    
    os.makedirs(dataset_dir, exist_ok=True)
    os.makedirs(report_dir, exist_ok=True)
    
    # 1. Dataset - model.bim (The core semantic model)
    # The TOM (Tabular Object Model) schema root
    tom_model = {
        "name": model_name,
        "compatibilityLevel": 1550,
        "tables": [],
        "relationships": []
    }
    
    for t in model.get('tables', []):
        table = {
            "name": t['name'],
            "columns": [],
            "measures": [],
            "partitions": [
                {
                    "name": f"Partition_{t['name']}",
                    "mode": "import",
                    "source": {
                        "type": "m",
                        "expression": f'let Source = #table({{"Col1"}}, {{}} ) in Source' 
                    }
                }
            ]
        }
        for c in t.get('columns', []):
            table['columns'].append({
                "name": c['name'],
                "dataType": c.get('dataType', 'string').lower()
            })
        for m in t.get('measures', []):
            table['measures'].append({
                "name": m['name'],
                "expression": m.get('expression', '')
            })
        tom_model['tables'].append(table)
        
    for r in model.get('relationships', []):
        tom_model['relationships'].append({
            "name": f"Rel_{r['fromTable']}_{r['toTable']}",
            "fromTable": r['fromTable'],
            "fromColumn": r['fromColumn'],
            "toTable": r['toTable'],
            "toColumn": r['toColumn']
        })
    
    # Standard model.bim is the TOM object directly
    with open(os.path.join(dataset_dir, 'model.bim'), 'w', encoding='utf-8') as f:
        json.dump(tom_model, f, indent=4)
        
    # 2. Dataset - definition.pbi
    with open(os.path.join(dataset_dir, 'definition.pbi'), 'w', encoding='utf-8') as f:
        json.dump({"version": "1.0"}, f)
        
    # 3. Report - report.json
    report = {
        "name": model_name,
        "pages": [{"name": "Page1", "displayName": "Executive Summary", "visualContainers": []}],
        "version": "1.0"
    }
    with open(os.path.join(report_dir, 'report.json'), 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=4)
        
    # 4. Root - .pbip file
    pbip_file = {
        "version": "1.0",
        "datasetReference": {
            "byPath": f"{model_name}.Dataset"
        },
        "reportReference": {
            "byPath": f"{model_name}.Report"
        }
    }
    with open(os.path.join(output_folder, f"{model_name}.pbip"), 'w', encoding='utf-8') as f:
        json.dump(pbip_file, f, indent=4)

    # Zip it up with a root folder
    zip_path = output_folder + '.zip'
    root_folder_in_zip = model_name
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
        for root_dir, _, files in os.walk(output_folder):
            for file in files:
                fp = os.path.join(root_dir, file)
                arc = os.path.relpath(fp, output_folder)
                z.write(fp, arcname=os.path.join(root_folder_in_zip, arc))
                
    return zip_path
