import { useState } from 'react';
import { Database, Check, X, Plus, Minus, Pencil, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Operation = {
  id: string;
  type: string;
  sql: string;
  destructive?: boolean;
  detail?: string;
};

type SchemaDiffCardProps = {
  operations: Operation[];
  onApprove: () => void;
  onReject: () => void;
};

function getOperationLabel(op: Operation): string {
  const table =
    op.type === 'drop_table'
      ? op.detail || op.sql.match(/DROP TABLE.*?"?(\w+\.\w+|\w+)"?/i)?.[1] || op.detail
      : undefined;
  switch (op.type) {
    case 'create_table':
      return `Create table ${op.detail || ''}`.trim();
    case 'add_column':
      return op.detail ? `Add column ${op.detail}` : 'Add column';
    case 'alter_column_type':
      return op.detail ? `Change column ${op.detail}` : 'Change column type';
    case 'drop_column':
      return op.detail ? `Drop column ${op.detail}` : 'Drop column';
    case 'drop_table':
      return `Drop table ${table || ''}`.trim();
    case 'create_index':
      return op.detail ? `Add index ${op.detail}` : 'Add index';
    case 'add_foreign_key':
      return op.detail ? `Add foreign key ${op.detail}` : 'Add foreign key';
    case 'add_check_constraint':
      return op.detail ? `Add constraint ${op.detail}` : 'Add constraint';
    case 'drop_foreign_key':
      return op.detail ? `Remove foreign key ${op.detail}` : 'Remove foreign key';
    case 'drop_index':
      return op.detail ? `Remove index ${op.detail}` : 'Remove index';
    default:
      return op.type.replace(/_/g, ' ');
  }
}

type OpCategory = 'additive' | 'alter' | 'destructive';

function getCategory(op: Operation): OpCategory {
  if (
    op.type === 'create_table' ||
    op.type === 'add_column' ||
    op.type === 'create_index' ||
    op.type === 'add_foreign_key' ||
    op.type === 'add_check_constraint'
  ) {
    return 'additive';
  }
  if (
    op.destructive ||
    op.type === 'drop_column' ||
    op.type === 'drop_table' ||
    op.type === 'drop_foreign_key' ||
    op.type === 'drop_index'
  ) {
    return 'destructive';
  }
  return 'alter';
}

function OpIcon({ category }: { category: OpCategory }) {
  switch (category) {
    case 'additive':
      return <Plus className="size-3 text-emerald-500" />;
    case 'destructive':
      return <Minus className="size-3 text-red-400" />;
    case 'alter':
      return <Pencil className="size-3 text-amber-400" />;
  }
}

export function SchemaDiffCard({ operations, onApprove, onReject }: SchemaDiffCardProps) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const hasDestructive = operations.some((op) => getCategory(op) === 'destructive');

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Database className="size-4" />
        <span>Schema Changes</span>
        <span className="text-xs text-muted-foreground">
          {operations.length} {operations.length === 1 ? 'operation' : 'operations'}
        </span>
        {status === 'approved' && <span className="text-xs text-emerald-500">Applied</span>}
        {status === 'rejected' && <span className="text-xs text-muted-foreground">Rejected</span>}
      </div>

      <div className="space-y-1">
        {operations.map((op, i) => {
          const category = getCategory(op);
          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs',
                category === 'destructive' && 'bg-red-400/5',
              )}
            >
              <OpIcon category={category} />
              <span
                className={cn(
                  'flex-1',
                  category === 'additive' && 'text-foreground',
                  category === 'alter' && 'text-foreground',
                  category === 'destructive' && 'text-red-400',
                )}
              >
                {getOperationLabel(op)}
              </span>
              {category === 'destructive' && (
                <span className="rounded bg-red-400/10 px-1.5 py-0.5 text-[10px] text-red-400">
                  destructive
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Code className="size-3" />
              View SQL
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Schema Changes SQL</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-3">
              {operations.map((op, i) => {
                const category = getCategory(op);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <OpIcon category={category} />
                      <span className="font-medium">{getOperationLabel(op)}</span>
                    </div>
                    <pre className="rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap text-muted-foreground">
                      {op.sql}
                    </pre>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {status === 'pending' && (
          <>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus('rejected');
                onReject();
              }}
            >
              <X className="mr-1 size-3" />
              Reject
            </Button>
            <Button
              size="sm"
              variant={hasDestructive ? 'destructive' : 'default'}
              onClick={() => {
                setStatus('approved');
                onApprove();
              }}
            >
              <Check className="mr-1 size-3" />
              Approve
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
