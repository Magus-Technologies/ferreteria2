"use client";

import { useEffect, useRef } from "react";
import "quill/dist/quill.snow.css";
import type Quill from "quill";

interface QuillEditorProps {
  value: string;
  onChange: (html: string, plainTextLength: number) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
}

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ align: [] }],
  [{ color: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["clean"],
];

export default function QuillEditor({
  value,
  onChange,
  placeholder,
  readOnly = false,
  minHeight = 160,
}: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Inicializacion una sola vez (carga Quill solo en cliente)
  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    let cancelled = false;
    let mountedEditor: HTMLDivElement | null = null;
    const containerAtMount = containerRef.current;

    (async () => {
      const QuillModule = (await import("quill")).default;
      if (cancelled || !containerAtMount) return;

      const editorEl = document.createElement("div");
      containerAtMount.appendChild(editorEl);
      mountedEditor = editorEl;

      const quill = new QuillModule(editorEl, {
        theme: "snow",
        readOnly,
        placeholder,
        modules: { toolbar: TOOLBAR },
      });

      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        const text = quill.getText().replace(/\n+$/, "");
        onChangeRef.current(html, text.length);
      });

      quillRef.current = quill;

      if (value) {
        quill.clipboard.dangerouslyPasteHTML(value, "silent");
      }
    })();

    return () => {
      cancelled = true;
      quillRef.current = null;
      if (mountedEditor && containerAtMount?.contains(mountedEditor)) {
        containerAtMount.innerHTML = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync externo -> editor (cuando value cambia desde afuera)
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    if (value === quill.root.innerHTML) return;
    quill.clipboard.dangerouslyPasteHTML(value || "", "silent");
  }, [value]);

  useEffect(() => {
    quillRef.current?.enable(!readOnly);
  }, [readOnly]);

  return (
    <div
      className="quill-editor-wrapper"
      style={{ ["--quill-min-height" as any]: `${minHeight}px` }}
    >
      <div ref={containerRef} />
      <style jsx global>{`
        .quill-editor-wrapper .ql-toolbar.ql-snow {
          border-color: #e2e8f0;
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
          background: #fff;
        }
        .quill-editor-wrapper .ql-container.ql-snow {
          border-color: #e2e8f0;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
          background: #fff;
        }
        .quill-editor-wrapper .ql-editor {
          min-height: var(--quill-min-height, 160px);
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
