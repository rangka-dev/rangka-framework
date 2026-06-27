import { useRef, useCallback } from 'react';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';

type CodeEditorTabProps = {
  filename: string;
  content: string;
  language: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
};

function defineStudioTheme(monaco: Monaco) {
  monaco.editor.defineTheme('studio-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1e2028',
      'editor.foreground': '#e4e4e8',
      'editorLineNumber.foreground': '#4a4d5a',
      'editorLineNumber.activeForeground': '#8b8fa3',
      'editor.selectionBackground': '#3a3d4a',
      'editor.lineHighlightBackground': '#25272f',
      'editorWidget.background': '#1e2028',
      'editorWidget.border': '#2e3040',
      'input.background': '#25272f',
      'scrollbar.shadow': '#00000000',
      'editorOverviewRuler.border': '#00000000',
    },
  });
  monaco.editor.defineTheme('studio-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1e2028',
      'editorLineNumber.foreground': '#b0b4c0',
      'editorLineNumber.activeForeground': '#6b7080',
      'editor.selectionBackground': '#dde1ea',
      'editor.lineHighlightBackground': '#f5f6f8',
      'editorWidget.background': '#ffffff',
      'editorWidget.border': '#e4e5ea',
      'input.background': '#f5f6f8',
      'scrollbar.shadow': '#00000000',
      'editorOverviewRuler.border': '#00000000',
    },
  });
}

export function CodeEditorTab({ content, language, onChange, onSave }: CodeEditorTabProps) {
  const themeReady = useRef(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  function handleBeforeMount(monaco: Monaco) {
    if (!themeReady.current) {
      defineStudioTheme(monaco);
      themeReady.current = true;
    }
  }

  const handleMount: OnMount = useCallback(
    (editorInstance, monaco) => {
      editorRef.current = editorInstance;
      editorInstance.addAction({
        id: 'studio.save',
        label: 'Save File',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: (ed) => {
          onSave?.(ed.getValue());
        },
      });
    },
    [onSave],
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        onChange?.(value);
      }
    },
    [onChange],
  );

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="h-full">
      <Editor
        theme={isDark ? 'studio-dark' : 'studio-light'}
        language={language}
        value={content}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 12 },
          renderLineHighlight: 'line',
        }}
      />
    </div>
  );
}
