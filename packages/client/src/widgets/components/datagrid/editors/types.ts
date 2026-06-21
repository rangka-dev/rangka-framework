export interface CellEditorProps {
  value: unknown;
  field: string;
  meta:
    | {
        type: string;
        label: string;
        required: boolean;
        options?: readonly string[];
        readOnly: boolean;
        relatedModel?: string;
      }
    | undefined;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
}
