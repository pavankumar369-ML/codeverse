import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTrace } from '../store/useTrace.js';
import { byId } from '../algorithms/index.js';

export default function EditorPane() {
  const algoId = useTrace((s) => s.algoId);
  const index = useTrace((s) => s.index);
  const line = useTrace((s) => s.frames[s.index]?.line ?? 1);
  const algo = byId(algoId);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(line, 1, line, 1),
        options: { isWholeLine: true, className: 'activeLine', linesDecorationsClassName: 'activeGutter' },
      },
    ]);
    editor.revealLineInCenterIfOutsideViewport(line);
  }, [line, index, algoId]);

  return (
    <div className="editor">
      <div className="editor__head">
        <span>{algo.name}</span>
        <span className="mono editor__complexity">{algo.bigO.time}</span>
      </div>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        path={algo.id}
        value={algo.code}
        theme="vs-dark"
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco;
          monaco.editor.defineTheme('codeverse', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
              'editor.background': '#111827',
              'editorLineNumber.foreground': '#3B4A6B',
              'editorGutter.background': '#111827',
            },
          });
          monaco.editor.setTheme('codeverse');
        }}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 13,
          lineHeight: 20,
          scrollBeyondLastLine: false,
          renderLineHighlight: 'none',
          glyphMargin: false,
          folding: false,
          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
        }}
      />
    </div>
  );
}
