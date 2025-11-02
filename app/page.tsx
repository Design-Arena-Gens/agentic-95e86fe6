"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TooltipDescriptor = {
  id: string;
  text: string;
  preview: string;
};

const initialDocument =
  "<p>Comece a escrever e formate o conteúdo com o painel lateral.</p>";

const formatGroups: {
  label: string;
  actions: {
    label: string;
    command: string;
    value?: string;
    icon: string;
  }[];
}[] = [
  {
    label: "Estilo",
    actions: [
      { label: "Negrito", command: "bold", icon: "B" },
      { label: "Itálico", command: "italic", icon: "I" },
      { label: "Sublinhado", command: "underline", icon: "U" },
      { label: "Riscado", command: "strikeThrough", icon: "S" },
      { label: "Código", command: "formatBlock", value: "pre", icon: "</>" }
    ]
  },
  {
    label: "Bloco",
    actions: [
      { label: "Título 1", command: "formatBlock", value: "h1", icon: "H1" },
      { label: "Título 2", command: "formatBlock", value: "h2", icon: "H2" },
      { label: "Parágrafo", command: "formatBlock", value: "p", icon: "P" },
      { label: "Citação", command: "formatBlock", value: "blockquote", icon: "❝" }
    ]
  },
  {
    label: "Listas",
    actions: [
      { label: "Lista ordenada", command: "insertOrderedList", icon: "1." },
      { label: "Lista", command: "insertUnorderedList", icon: "•" }
    ]
  },
  {
    label: "Alinhamento",
    actions: [
      { label: "Esquerda", command: "justifyLeft", icon: "⟸" },
      { label: "Centro", command: "justifyCenter", icon: "⇔" },
      { label: "Direita", command: "justifyRight", icon: "⟹" },
      { label: "Justificar", command: "justifyFull", icon: "⟺" }
    ]
  }
];

export default function Page() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [html, setHtml] = useState<string>(initialDocument);
  const [tooltipText, setTooltipText] = useState("");
  const [tooltipNodes, setTooltipNodes] = useState<TooltipDescriptor[]>([]);
  const [color, setColor] = useState("#38bdf8");
  const [highlight, setHighlight] = useState("#0f172a");

  const syncHtml = useCallback(() => {
    const root = editorRef.current;
    if (!root) return;
    setHtml(root.innerHTML);
  }, []);

  const applyCommand = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value ?? "");
      syncHtml();
    },
    [syncHtml]
  );

  const handleColorChange = useCallback(
    (type: "foreColor" | "hiliteColor", value: string) => {
      document.execCommand(type, false, value);
      syncHtml();
    },
    [syncHtml]
  );

  const handleAddTooltip = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const tooltip = tooltipText.trim();
    if (!tooltip) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const span = document.createElement("span");
    span.className = "tooltip-anchor";
    span.setAttribute("data-tooltip", tooltip);
    span.setAttribute("data-tooltip-id", crypto.randomUUID());
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
    selection.removeAllRanges();
    setTooltipText("");
    syncHtml();
  }, [tooltipText, syncHtml]);

  const handleRemoveTooltip = useCallback((id: string) => {
    const root = editorRef.current;
    if (!root) return;
    const node = root.querySelector(`[data-tooltip-id="${id}"]`);
    if (!node) return;
    const element = node as HTMLElement;
    const parent = element.parentElement;
    if (!parent) return;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
    syncHtml();
  }, [syncHtml]);

  const handleExport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(html);
      alert("HTML copiado para a área de transferência!");
    } catch (error) {
      console.error(error);
      alert("Não foi possível copiar o HTML.");
    }
  }, [html]);

  useEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    root.innerHTML = initialDocument;
  }, []);

  useEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    const anchors = Array.from(root.querySelectorAll("[data-tooltip]"));
    const descriptors = anchors.map((anchor, index) => {
      const element = anchor as HTMLElement;
      if (!element.dataset.tooltipId) {
        element.dataset.tooltipId = crypto.randomUUID();
      }
      return {
        id: element.dataset.tooltipId as string,
        text: element.dataset.tooltip ?? "",
        preview: element.textContent?.trim().slice(0, 60) ?? ""
      } satisfies TooltipDescriptor;
    });
    setTooltipNodes(descriptors);
  }, [html]);

  const editorToolbar = useMemo(
    () =>
      formatGroups.map((group) => (
        <div className="toolbar-group" key={group.label}>
          <span className="toolbar-label">{group.label}</span>
          <div className="toolbar-actions">
            {group.actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand(action.command, action.value)}
                title={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>
        </div>
      )),
    [applyCommand]
  );

  return (
    <main className="shell">
      <section className="editor-card">
        <header className="editor-header">
          <div>
            <h1>Editor enriquecido</h1>
            <p>
              Escreva, formate, adicione tooltips, ajuste cores, gere blocos e
              exporte o HTML final.
            </p>
          </div>
          <button type="button" className="export-button" onClick={handleExport}>
            Copiar HTML
          </button>
        </header>
        <div className="editor-body">
          <aside className="sidebar">
            <div className="panel">
              <h2>Formatação</h2>
              {editorToolbar}
            </div>
            <div className="panel">
              <h2>Cores</h2>
              <label className="color-picker">
                <span>Cor do texto</span>
                <input
                  type="color"
                  value={color}
                  onChange={(event) => {
                    const value = event.target.value;
                    setColor(value);
                    handleColorChange("foreColor", value);
                  }}
                />
              </label>
              <label className="color-picker">
                <span>Marcador</span>
                <input
                  type="color"
                  value={highlight}
                  onChange={(event) => {
                    const value = event.target.value;
                    setHighlight(value);
                    handleColorChange("hiliteColor", value);
                  }}
                />
              </label>
            </div>
            <div className="panel">
              <h2>Tooltips</h2>
              <div className="tooltip-form">
                <input
                  type="text"
                  placeholder="Mensagem do tooltip"
                  value={tooltipText}
                  onChange={(event) => setTooltipText(event.target.value)}
                />
                <button type="button" onClick={handleAddTooltip} disabled={!tooltipText.trim()}>
                  Aplicar ao trecho selecionado
                </button>
              </div>
              <div className="tooltip-list">
                {tooltipNodes.length === 0 ? (
                  <p className="tooltip-empty">Nenhum tooltip adicionado.</p>
                ) : (
                  tooltipNodes.map((tooltip) => (
                    <div className="tooltip-item" key={tooltip.id}>
                      <div>
                        <strong>{tooltip.preview || "(sem texto)"}</strong>
                        <p>{tooltip.text}</p>
                      </div>
                      <button type="button" onClick={() => handleRemoveTooltip(tooltip.id)}>
                        Remover
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="panel">
              <h2>Utilidades</h2>
              <div className="utility-buttons">
                <button type="button" onClick={() => applyCommand("undo")}>Desfazer</button>
                <button type="button" onClick={() => applyCommand("redo")}>Refazer</button>
                <button type="button" onClick={() => applyCommand("removeFormat")}>Limpar estilo</button>
              </div>
            </div>
          </aside>
          <div className="workspace">
            <div className="editable-wrapper">
              <div
                ref={editorRef}
                className="editable"
                contentEditable
                spellCheck
                suppressContentEditableWarning
                onInput={syncHtml}
                onBlur={syncHtml}
              />
            </div>
            <div className="preview">
              <h2>Preview HTML</h2>
              <iframe title="Preview" srcDoc={`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" /><style>${previewStyles}</style></head><body>${html}</body></html>`} />
            </div>
            <div className="html-output">
              <h2>HTML gerado</h2>
              <textarea value={html} readOnly />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const previewStyles = `
  body {
    font-family: 'Inter', system-ui, sans-serif;
    color: #0f172a;
    padding: 2rem;
    max-width: 70ch;
    margin: 0 auto;
    line-height: 1.65;
  }
  h1, h2, h3 {
    color: #1d4ed8;
  }
  pre {
    background: #0f172a;
    color: #e2e8f0;
    padding: 1rem;
    border-radius: 0.75rem;
    overflow-x: auto;
  }
  blockquote {
    border-left: 4px solid #1d4ed8;
    padding-left: 1rem;
    color: #334155;
    margin: 1.5rem 0;
  }
  .tooltip-anchor {
    position: relative;
    cursor: help;
    border-bottom: 1px dashed #2563eb;
  }
  .tooltip-anchor::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 50%;
    transform: translateX(-50%) translateY(8px);
    background: #1d4ed8;
    color: white;
    padding: 0.4rem 0.6rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease;
    z-index: 10;
  }
  .tooltip-anchor:hover::after {
    opacity: 1;
    transform: translateX(-50%) translateY(-6px);
  }
`;
