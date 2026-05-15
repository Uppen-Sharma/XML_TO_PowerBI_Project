import { useState } from "react";
import axios from "axios";
import {
  CheckCircle,
  Layout,
  Database,
  Terminal,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Loader2,
  Plus,
  Trash2,
  XCircle,
  AlertCircle,
  Search
} from "lucide-react";
import RelationshipDesigner from "./RelationshipDesigner";
import DaxEditor from "./DaxEditor";

export const PreviewStep = ({ model, onNext, onBack }) => {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="grow overflow-y-auto custom-scrollbar pr-2 mb-4 pb-4 min-h-0">
        <p className="text-sm text-slate-500 mb-6 font-medium">
          Review the detected structure from your Cognos XML.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {model.tables.map((table, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-card-border bg-container-bg flex flex-col shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Layout size={18} className="text-primary" />
                </div>
                <h4 className="font-bold text-[#0b132b] truncate">{table.name}</h4>
              </div>
              <div className="flex gap-4 text-xs font-semibold text-slate-500 mt-auto pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-100">
                  <Database size={14} className="text-primary" /> {table.columns.length} Cols
                </span>
                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-100">
                  <Terminal size={14} className="text-accent" /> {table.measures.length} Meas
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-4 mt-auto shrink-0 pt-4 border-t border-slate-100 bg-white">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-2 px-6 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-btn"
        >
          Next: Relationships <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export const RelationshipStep = ({ model, setModel, onNext, onBack }) => {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="grow mb-4 overflow-hidden relative border border-slate-200 rounded-xl min-h-0">
        <RelationshipDesigner 
          model={model} 
          setModel={setModel} 
        />
      </div>
      <div className="flex gap-4 mt-auto shrink-0 pt-4 border-t border-slate-100 bg-white">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-2 px-6 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-btn"
        >
          Next: Mapping <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export const MappingStep = ({ model, setModel, onNext, onBack }) => {
  const [activeTableIdx, setActiveTableIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(null);
  const [isValidating, setIsValidating] = useState(null);
  const [validationResults, setValidationResults] = useState({});
  const [querySearch, setQuerySearch] = useState("");
  const [columnSearch, setColumnSearch] = useState("");
  
  if (!model || !model.tables) return <div className="p-8 text-center text-slate-500">Invalid model data.</div>;

  const table = model.tables[activeTableIdx] || { name: "None", columns: [], measures: [] };

  const filteredQueries = model.tables.map((t, i) => ({ ...t, originalIdx: i }))
    .filter(t => t.name.toLowerCase().includes(querySearch.toLowerCase()));

  const filteredColumns = table.columns.map((c, i) => ({ ...c, originalIdx: i }))
    .filter(c => c.name.toLowerCase().includes(columnSearch.toLowerCase()));

  const updateTable = (updates) => {
    if (!model.tables[activeTableIdx]) return;
    const newModel = { ...model };
    newModel.tables[activeTableIdx] = {
      ...newModel.tables[activeTableIdx],
      ...updates,
    };
    setModel(newModel);
  };

  const addColumn = () => {
    const cols = [...table.columns, { name: "New Column", dataType: "String" }];
    updateTable({ columns: cols });
  };

  const removeColumn = (idx) => {
    const cols = table.columns.filter((_, i) => i !== idx);
    updateTable({ columns: cols });
  };

  const addMeasure = () => {
    const meas = [...table.measures, { name: "New Measure", expression: "" }];
    updateTable({ measures: meas });
  };

  const removeMeasure = (idx) => {
    const meas = table.measures.filter((_, i) => i !== idx);
    updateTable({ measures: meas });
  };

  const deleteTable = (idx) => {
    if (!window.confirm(`Are you sure you want to delete query "${model.tables[idx].name}"?`)) return;
    const newTables = model.tables.filter((_, i) => i !== idx);
    const newModel = { ...model, tables: newTables };
    setModel(newModel);
    if (activeTableIdx >= newTables.length) {
      setActiveTableIdx(Math.max(0, newTables.length - 1));
    }
  };

  const handleAiGenerate = async (idx) => {
    setIsGenerating(idx);
    try {
      const response = await axios.post("/generate-dax", {
        expression: table.measures[idx].expression,
        model: model
      });
      const meas = [...table.measures];
      meas[idx].expression = response.data.dax;
      updateTable({ measures: meas });
    } catch (err) {
      console.error("AI Generation failed", err);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleAiValidate = async (idx) => {
    setIsValidating(idx);
    try {
      const response = await axios.post("/validate-dax", {
        dax: table.measures[idx].expression,
        model: model
      });
      setValidationResults(prev => ({
        ...prev,
        [idx]: response.data
      }));
    } catch (err) {
      console.error("AI Validation failed", err);
    } finally {
      setIsValidating(null);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex grow overflow-hidden mb-4 min-h-0">
        {/* Left Sidebar: Table Selection */}
        <div className="w-56 shrink-0 border-r border-slate-100 pr-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar min-h-0">
          <div className="flex items-center justify-between mb-2 px-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Queries
            </h4>
            <button 
              type="button"
              onClick={() => {
                const name = window.prompt("Enter new query name:");
                if (name) {
                  setModel({
                    ...model,
                    tables: [...model.tables, { name, columns: [], measures: [] }]
                  });
                }
              }}
              className="p-1 rounded hover:bg-slate-100 text-primary transition-colors"
              title="Add Query"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="relative mb-2 px-2">
            <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={querySearch}
              onChange={(e) => setQuerySearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {filteredQueries.map((t) => (
            <div key={t.originalIdx} className="group relative">
              <button
                onClick={() => setActiveTableIdx(t.originalIdx)}
                className={`w-full p-3 rounded-xl text-xs font-bold text-left transition-all border flex items-center gap-2 ${
                  activeTableIdx === t.originalIdx
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-white text-slate-600 border-slate-100 hover:border-primary/50 hover:bg-slate-50"
                }`}
              >
                <Layout size={14} className={activeTableIdx === t.originalIdx ? "text-white" : "text-slate-400 group-hover:text-primary"} />
                <span className="truncate pr-4">{t.name}</span>
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); deleteTable(t.originalIdx); }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all ${activeTableIdx === t.originalIdx ? "text-white/80 hover:bg-white/20" : ""}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {filteredQueries.length === 0 && (
            <div className="px-2 py-4 text-center text-[10px] text-slate-400 italic">
              No results
            </div>
          )}
        </div>

        {/* Right Content: Mapping Details */}
        <div className="grow pl-6 overflow-y-auto custom-scrollbar pr-2 pb-6 min-h-0">
          <div className="space-y-10">
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-primary" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-400">
                      Columns
                    </h4>
                  </div>
                  <div className="relative w-48">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      value={columnSearch}
                      onChange={(e) => setColumnSearch(e.target.value)}
                      placeholder="Filter columns..."
                      className="w-full pl-8 pr-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={addColumn}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-[10px] font-bold hover:bg-primary/10 transition-all"
                >
                  <Plus size={12} /> Add Column
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredColumns.map((col) => (
                  <div key={col.originalIdx} className="flex gap-2 p-2 bg-white rounded-lg border border-slate-100 group hover:border-primary/20 transition-all items-center">
                    <input
                      value={col.name}
                      onChange={(e) => {
                        const cols = [...table.columns];
                        cols[col.originalIdx].name = e.target.value;
                        updateTable({ columns: cols });
                      }}
                      className="grow p-1.5 text-xs font-semibold border-none focus:ring-0 outline-none bg-transparent"
                    />
                    <select
                      value={col.dataType}
                      onChange={(e) => {
                        const cols = [...table.columns];
                        cols[col.originalIdx].dataType = e.target.value;
                        updateTable({ columns: cols });
                      }}
                      className="p-1 text-[10px] font-bold border-none focus:ring-0 rounded-md bg-slate-50 text-slate-500 uppercase cursor-pointer"
                    >
                      <option>String</option>
                      <option>Int64</option>
                      <option>Double</option>
                      <option>DateTime</option>
                      <option>Boolean</option>
                    </select>
                    <button 
                      type="button"
                      onClick={() => removeColumn(col.originalIdx)}
                      className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {filteredColumns.length === 0 && (
                  <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs italic">
                    {table.columns.length === 0 ? "No columns defined. Click 'Add Column' to begin." : "No columns match your filter."}
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Terminal size={16} className="text-accent" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-400">
                    Measures
                  </h4>
                </div>
                <button 
                  type="button"
                  onClick={addMeasure}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent/5 text-accent text-[10px] font-bold hover:bg-accent/10 transition-all"
                >
                  <Plus size={12} /> Add Measure
                </button>
              </div>
              <div className="space-y-6">
                {table.measures.map((m, i) => (
                  <div
                    key={i}
                    className="p-5 border border-card-border rounded-xl bg-white shadow-sm relative group hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex grow items-center gap-2">
                        <input
                          value={m.name}
                          onChange={(e) => {
                            const meas = [...table.measures];
                            meas[i].name = e.target.value;
                            updateTable({ measures: meas });
                          }}
                          className="grow p-1 text-sm font-bold bg-transparent border-b border-transparent focus:border-primary outline-none transition-colors"
                          placeholder="Measure Name"
                        />
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button 
                          type="button"
                          onClick={() => handleAiGenerate(i)}
                          disabled={isGenerating !== null}
                          className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
                          title="AI Generate DAX"
                        >
                          {isGenerating === i ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleAiValidate(i)}
                          disabled={isValidating !== null}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-sm"
                          title="Validate DAX"
                        >
                          {isValidating === i ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                        </button>
                        <button 
                          type="button"
                          onClick={() => removeMeasure(i)}
                          className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors border border-slate-100"
                          title="Remove Measure"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <DaxEditor 
                      value={m.expression}
                      onChange={(val) => {
                        const meas = [...table.measures];
                        meas[i].expression = val;
                        updateTable({ measures: meas });
                        // Clear validation result on change
                        if (validationResults[i]) {
                          const results = { ...validationResults };
                          delete results[i];
                          setValidationResults(results);
                        }
                      }}
                    />

                    {validationResults[i] && (
                      <div className={`mt-3 p-3 rounded-lg flex items-start gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-300 ${
                        validationResults[i].valid 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}>
                        {validationResults[i].valid ? (
                          <>
                            <CheckCircle size={14} className="shrink-0 mt-0.5" />
                            <p className="font-medium">DAX is valid and ready for Power BI.</p>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold mb-1">Validation Issues:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {validationResults[i].issues?.map((issue, idx) => (
                                  <li key={idx}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          </>
                        )}
                        <button 
                          type="button"
                          onClick={() => {
                            const results = { ...validationResults };
                            delete results[i];
                            setValidationResults(results);
                          }}
                          className="ml-auto p-1 hover:bg-black/5 rounded"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {table.measures.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm italic">
                    No measures defined for this query.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-auto shrink-0 pt-4 border-t border-slate-100 bg-white">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-2 px-6 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-btn"
        >
          Convert to PBIP <CheckCircle size={18} />
        </button>
      </div>
    </div>
  );
};
