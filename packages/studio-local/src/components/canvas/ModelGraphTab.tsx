import { useMemo, useState, useSyncExternalStore } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  useNodesState,
  type NodeProps,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, ChevronDown, ChevronRight } from 'lucide-react';
import { useStudio } from '@/hooks/useStudio';
import { getLayoutedPositions } from '@/lib/layout';
import type { ModelGraphField } from '@rangka/studio-core/protocol';

type ModelNodeData = {
  label: string;
  app: string;
  fields: ModelGraphField[];
  connectedHandles: Record<string, true>;
};

const NODE_WIDTH = 220;
const NODE_BASE_HEIGHT = 40;
const FIELD_ROW_HEIGHT = 22;

function estimateNodeHeight(fieldCount: number) {
  return NODE_BASE_HEIGHT + fieldCount * FIELD_ROW_HEIGHT + 8;
}

function ModelNode({ id, data }: NodeProps<Node<ModelNodeData>>) {
  const [expanded, setExpanded] = useState(true);
  const visibleFields = expanded ? data.fields : data.fields.slice(0, 3);
  const hasMore = !expanded && data.fields.length > 3;
  const hasNodeTarget = data.connectedHandles[`${id}-__node-left`];
  const hasNodeSource = data.connectedHandles[`${id}-__node-right`];

  return (
    <div className="relative w-[220px] rounded-lg border border-border bg-card shadow-sm hover:border-primary/50">
      {hasNodeTarget && (
        <Handle
          type="target"
          position={Position.Left}
          id={`${id}-__node-left`}
          className="!bg-muted-foreground !w-2 !h-2"
          style={{ position: 'absolute', top: '20px' }}
        />
      )}
      {hasNodeSource && (
        <Handle
          type="source"
          position={Position.Right}
          id={`${id}-__node-right`}
          className="!bg-muted-foreground !w-2 !h-2"
          style={{ position: 'absolute', top: '20px' }}
        />
      )}
      {/* Header - drag handle */}
      <div className="drag-handle flex items-center gap-2 border-b border-border px-3 py-2 cursor-grab">
        <div className="flex size-5 items-center justify-center rounded bg-primary/10">
          <Box className="size-3 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">{data.label}</div>
        </div>
        <span className="text-[10px] text-muted-foreground">{data.app}</span>
      </div>

      {/* Fields */}
      <div className="py-1">
        {visibleFields.map((field) => (
          <div
            key={field.name}
            className="relative flex items-center gap-2 px-3 py-1"
            style={{ minHeight: FIELD_ROW_HEIGHT }}
          >
            {data.connectedHandles[`${id}-${field.name}-left`] && (
              <Handle
                type="target"
                position={Position.Left}
                id={`${id}-${field.name}-left`}
                className="!bg-muted-foreground !w-2 !h-2 !translate-y-0"
                style={{ position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)' }}
              />
            )}
            <div className="flex size-4 shrink-0 items-center justify-center rounded border border-border bg-muted/50">
              <span className="text-[8px] font-medium text-muted-foreground">
                {field.type.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="flex-1 text-[11px] truncate">{field.name}</span>
            <span className="text-[10px] text-muted-foreground">{field.type}</span>
            {data.connectedHandles[`${id}-${field.name}-right`] && (
              <Handle
                type="source"
                position={Position.Right}
                id={`${id}-${field.name}-right`}
                className="!bg-muted-foreground !w-2 !h-2 !translate-y-0"
                style={{ position: 'absolute', top: '50%', transform: 'translate(50%, -50%)' }}
              />
            )}
          </div>
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded(true)}
            className="nodrag flex w-full items-center gap-1 px-3 py-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="size-3" />
            <span>{data.fields.length - 3} more fields</span>
          </button>
        )}
        {expanded && data.fields.length > 3 && (
          <button
            onClick={() => setExpanded(false)}
            className="nodrag flex w-full items-center gap-1 px-3 py-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="size-3" />
            <span>Show less</span>
          </button>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { model: ModelNode };

function subscribeToTheme(cb: () => void) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function getColorMode(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ModelGraphTab() {
  const { modelGraph } = useStudio();
  const colorMode = useSyncExternalStore(subscribeToTheme, getColorMode);

  const connectedHandles = useMemo(() => {
    const map: Record<string, true> = {};
    for (const edge of modelGraph.edges) {
      map[`${edge.source}-${edge.sourceField}-right`] = true;
      map[`${edge.target}-${edge.targetField}-left`] = true;
    }
    return map;
  }, [modelGraph.edges]);

  const edges = useMemo(
    () =>
      modelGraph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: `${edge.source}-${edge.sourceField}-right`,
        target: edge.target,
        targetHandle: `${edge.target}-${edge.targetField}-left`,
        type: 'smoothstep' as const,
        style: { stroke: 'var(--muted-foreground)', strokeWidth: 2 },
      })),
    [modelGraph.edges],
  );

  const initialNodes = useMemo(() => {
    if (modelGraph.nodes.length === 0) return [];

    const layoutNodes = modelGraph.nodes.map((node) => ({
      id: node.id,
      width: NODE_WIDTH,
      height: estimateNodeHeight(node.fields.length),
    }));

    const layoutEdges = modelGraph.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    const positions = getLayoutedPositions(layoutNodes, layoutEdges, 'LR');

    return modelGraph.nodes.map((node) => ({
      id: node.id,
      type: 'model' as const,
      position: positions[node.id] ?? { x: 0, y: 0 },
      dragHandle: '.drag-handle',
      data: {
        label: node.label,
        module: node.app,
        fields: node.fields,
        connectedHandles,
      },
    }));
  }, [modelGraph.nodes, modelGraph.edges, connectedHandles]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);

  if (modelGraph.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No models yet. Define models in your apps to see the relationship graph.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        colorMode={colorMode}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
