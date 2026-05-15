import { useState, useCallback } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges 
} from 'reactflow';
import { X, Link2 } from 'lucide-react';
import 'reactflow/dist/style.css';

/**
 * Custom Modal for creating relationships
 */
const RelationshipModal = ({ isOpen, onClose, onConfirm, sourceTable, targetTable }) => {
  const [sourceCol, setSourceCol] = useState('');
  const [targetCol, setTargetCol] = useState('');

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Link2 size={18} />
            </div>
            <h3 className="font-bold text-slate-800">Create Relationship</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                From: <span className="text-primary">{sourceTable?.name}</span>
              </label>
              <select 
                value={sourceCol}
                onChange={(e) => setSourceCol(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none bg-slate-50 cursor-pointer"
              >
                <option value="">Select Column...</option>
                {sourceTable?.columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex justify-center">
              <div className="w-px h-6 bg-slate-200" />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                To: <span className="text-primary">{targetTable?.name}</span>
              </label>
              <select 
                value={targetCol}
                onChange={(e) => setTargetCol(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none bg-slate-50 cursor-pointer"
              >
                <option value="">Select Column...</option>
                {targetTable?.columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button 
            disabled={!sourceCol || !targetCol}
            onClick={() => onConfirm(sourceCol, targetCol)}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all shadow-btn ${
              !sourceCol || !targetCol ? "bg-slate-300 cursor-not-allowed" : "bg-primary hover:bg-primary-hover"
            }`}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RelationshipDesigner({ model, setModel }) {
  const [pendingConnection, setPendingConnection] = useState(null);

  // Initialize nodes from model. If model has positions, use them.
  const initialNodes = model.tables.map((t, i) => ({
    id: t.name,
    type: 'default',
    position: t.position || { x: i * 250, y: 50 },
    data: { 
      label: (
        <div className="flex flex-col w-full h-full">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 rounded-t-xl">
            <div className="font-bold text-[#0b132b] truncate text-sm">{t.name}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
              {t.columns.length} Columns
            </div>
          </div>
          <div className="p-2 space-y-1">
            {t.columns.map(c => (
              <div key={c.name} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 text-[11px] text-slate-600 transition-colors group/col">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover/col:bg-primary transition-colors" />
                <span className="truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    style: { 
      background: '#fff', 
      border: '1px solid #e2e8f0', 
      borderRadius: '10px',
      width: 220,
      padding: 0,
      fontSize: '11px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    }
  }));

  const initialEdges = (model.relationships || []).map((r, i) => ({
    id: r.id || `e-${r.fromTable}-${r.toTable}-${i}`,
    source: r.fromTable,
    target: r.toTable,
    label: `${r.fromColumn} → ${r.toColumn}`,
    labelStyle: { fill: '#0b132b', fontWeight: 700, fontSize: 9 },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 2,
    animated: true,
    style: { stroke: '#0ca1b6', strokeWidth: 2 },
    data: { ...r }
  }));

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  // Sync positions to model on drag stop
  const onNodeDragStop = useCallback((event, node) => {
    const updatedModel = { ...model };
    const tableIdx = updatedModel.tables.findIndex(t => t.name === node.id);
    if (tableIdx !== -1) {
      updatedModel.tables[tableIdx] = { 
        ...updatedModel.tables[tableIdx], 
        position: node.position 
      };
      setModel(updatedModel);
    }
  }, [model, setModel]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const nextEdges = applyEdgeChanges(changes, eds);
        
        // Check if any edges were removed
        const removedEdgeIds = changes
          .filter(c => c.type === 'remove')
          .map(c => c.id);
        
        if (removedEdgeIds.length > 0) {
          const updatedModel = { ...model };
          updatedModel.relationships = (model.relationships || []).filter((r, i) => {
            const edgeId = r.id || `e-${r.fromTable}-${r.toTable}-${i}`;
            return !removedEdgeIds.includes(edgeId);
          });
          setModel(updatedModel);
        }
        
        return nextEdges;
      });
    },
    [model, setModel]
  );

  const onConnect = useCallback((params) => {
    setPendingConnection(params);
  }, []);

  const handleConfirmConnection = (fromColumn, toColumn) => {
    const edgeId = `e-${pendingConnection.source}-${pendingConnection.target}-${Date.now()}`;
    const newRel = { 
      id: edgeId,
      fromTable: pendingConnection.source, 
      fromColumn, 
      toTable: pendingConnection.target, 
      toColumn 
    };

    const newEdge = { 
      ...pendingConnection, 
      id: edgeId, 
      label: `${fromColumn} → ${toColumn}`,
      animated: true,
      style: { stroke: '#0ca1b6', strokeWidth: 2 },
      data: newRel
    };

    setEdges((eds) => addEdge(newEdge, eds));

    const updatedModel = { ...model };
    updatedModel.relationships = [...(model.relationships || []), newRel];
    setModel(updatedModel);
    setPendingConnection(null);
  };

  return (
    <div className="w-full h-full bg-slate-50 relative">
      <div className="absolute top-2 right-2 z-10 bg-white/60 backdrop-blur-[2px] px-2 py-1 rounded border border-slate-200 text-[9px] text-slate-400 pointer-events-none">
        Drag tables • Connect dots • Del to remove
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        fitView
      >
        <Background color="#cbd5e1" gap={20} variant="dots" />
        <Controls showInteractive={false} className="bg-white/80 scale-75 origin-bottom-left" />
        <MiniMap 
          nodeColor="#0ca1b6" 
          maskColor="rgba(241, 245, 249, 0.7)"
          className="border border-slate-200 rounded-lg shadow-sm w-24! h-16!"
        />
      </ReactFlow>

      <RelationshipModal 
        isOpen={!!pendingConnection}
        onClose={() => setPendingConnection(null)}
        onConfirm={handleConfirmConnection}
        sourceTable={model.tables.find(t => t.name === pendingConnection?.source)}
        targetTable={model.tables.find(t => t.name === pendingConnection?.target)}
      />
    </div>
  );
}
