import os
import re
import logging

logger = logging.getLogger(__name__)

# Basic rule-based translator as fallback or pre-processor
def rule_based_translate(expression: str, model: dict) -> str:
    dax = expression
    
    # 1. Handle common Cognos functions
    dax = dax.replace('aggregate(', 'SUM(')
    dax = dax.replace('count(', 'COUNT(')
    dax = dax.replace('average(', 'AVERAGE(')
    dax = dax.replace('/', ' DIVIDE ')
    
    # 2. Try to qualify naked [Column] references if there's only one table
    if 'tables' in model and len(model['tables']) == 1:
        table_name = model['tables'][0]['name']
        dax = re.sub(r'\[(.*?)\]', f"'{table_name}'[\\1]", dax)
        
    return dax

def call_llm(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not found. Using rule-based fallback.")
        return None

    try:
        # If the user has google-generativeai installed, we could use it here.
        # For now, we'll return None to trigger fallback, but the structure is ready.
        # import google.generativeai as genai
        # genai.configure(api_key=api_key)
        # model = genai.GenerativeModel('gemini-pro')
        # response = model.generate_content(prompt)
        # return response.text.strip()
        return None
    except Exception as e:
        logger.error(f"LLM call failed: {str(e)}")
        return None

def build_prompt(expression: str, model: dict) -> str:
    tables_schema = []
    for t in model.get('tables', []):
        cols = [c['name'] for c in t.get('columns', [])]
        tables_schema.append(f"Table '{t['name']}' has columns: {', '.join(cols)}")
    
    schema_context = "\n".join(tables_schema)
    
    return f"""Task: Convert a Cognos BI report expression into a valid Power BI DAX expression.
Model Schema:
{schema_context}

Cognos Expression: {expression}

Instructions:
- Use fully qualified references: 'TableName'[ColumnName]
- Use DAX best practices (e.g., DIVIDE for division)
- Return ONLY the DAX expression, no explanation.

DAX:"""

def generate_dax(expression: str, model: dict) -> str:
    prompt = build_prompt(expression, model)
    
    # Try LLM first
    llm_response = call_llm(prompt)
    if llm_response:
        # Basic cleanup in case LLM returns markdown or extra text
        dax = llm_response.replace('```dax', '').replace('```', '').strip()
        return dax
        
    # Fallback to smart rules
    return rule_based_translate(expression, model)
