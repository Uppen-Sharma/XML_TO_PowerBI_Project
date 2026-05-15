import Editor from '@monaco-editor/react';
import { useRef } from 'react';

// Global to track if DAX is registered
let daxRegistered = false;

export default function DaxEditor({ value, onChange, height = "150px" }) {
  const monacoRef = useRef(null);

  function handleEditorDidMount(_editor, monaco) {
    monacoRef.current = monaco;

    if (!daxRegistered) {
      monaco.languages.register({ id: 'dax' });

      const daxFunctions = [
        'SUM', 'AVERAGE', 'COUNT', 'DIVIDE', 'CALCULATE', 'FILTER', 
        'ALL', 'RELATED', 'IF', 'SWITCH', 'SUMX', 'AVERAGEX', 
        'VALUES', 'DISTINCT', 'DATEADD', 'DATESYTD'
      ];

      monaco.languages.registerCompletionItemProvider('dax', {
        provideCompletionItems: () => {
          // Note: In a real app, we'd want this to be dynamic based on the latest model.
          // For now, we'll keep it simple but avoid duplicate registration.
          const suggestions = [
            ...daxFunctions.map(fn => ({
              label: fn,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: fn + '(${1:expression})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: `DAX Function: ${fn}`
            })),
          ];
          return { suggestions };
        }
      });
      daxRegistered = true;
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <Editor
        height={height}
        defaultLanguage="dax"
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="vs-light"
        options={{
          minimap: { enabled: false },
          fontSize: 12,
          scrollBeyondLastLine: false,
          lineNumbers: 'off',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
        }}
      />
    </div>
  );
}
