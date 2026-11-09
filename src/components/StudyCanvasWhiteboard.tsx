import React, { useRef, useState, useEffect } from 'react';
import {
  Palette,
  Eraser,
  PenTool,
  Highlighter,
  Type,
  Download,
  ExternalLink,
  Trash2,
  Undo2,
  Save,
  BookOpen,
  HelpCircle,
  Share2,
  Sparkles,
  Layers,
  ArrowUpRight,
  Maximize2,
  Check,
} from 'lucide-react';
import { getStoredCanvaProfile } from '../utils/canvaIntegration';

interface StudyCanvasWhiteboardProps {
  initialBackdropUrl?: string;
  onSendToTutor?: (topic: string, material: string) => void;
  onSendToMCQ?: (topic: string) => void;
  onSaveToNotes?: (title: string, content: string) => void;
}

type ToolMode = 'pen' | 'highlighter' | 'eraser' | 'arrow' | 'text';

const ANATOMICAL_COLORS = [
  { name: 'Arterial Red', value: '#ef4444' },
  { name: 'Venous Blue', value: '#3b82f6' },
  { name: 'Nerve Yellow', value: '#eab308' },
  { name: 'Bone White', value: '#f8fafc' },
  { name: 'Lymph Green', value: '#10b981' },
  { name: 'Surgical Charcoal', value: '#18181b' },
];

export const StudyCanvasWhiteboard: React.FC<StudyCanvasWhiteboardProps> = ({
  initialBackdropUrl,
  onSendToTutor,
  onSendToMCQ,
  onSaveToNotes,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<ToolMode>('pen');
  const [color, setColor] = useState<string>('#ef4444');
  const [lineWidth, setLineWidth] = useState<number>(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [diagramTitle, setDiagramTitle] = useState('Anatomical Dissection & Biomechanical Annotations');
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvaProfile = getStoredCanvaProfile();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI resolution with fallback if rendered while hidden
    const rect = canvas.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : 900;
    const h = rect.height > 0 ? rect.height : 580;
    canvas.width = w * 2;
    canvas.height = h * 2;
    ctx.scale(2, 2);

    // Initial background: Dark clinical board or loaded backdrop
    ctx.fillStyle = '#090e17';
    ctx.fillRect(0, 0, w, h);

    // Grid lines for precise anatomical sketching
    ctx.strokeStyle = '#1a2434';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Save initial state for undo safely
    if (canvas.width > 0 && canvas.height > 0) {
      try {
        const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack([initialData]);
      } catch (e) {
        // Safe catch for headless environments
      }
    }
  }, []);

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setUndoStack((prev) => [...prev.slice(-15), state]);
    } catch (e) {
      // Safe catch
    }
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newStack = [...undoStack];
    newStack.pop();
    const previous = newStack[newStack.length - 1];
    ctx.putImageData(previous, 0, 0);
    setUndoStack(newStack);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#090e17';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Redraw grid
    ctx.strokeStyle = '#1a2434';
    ctx.lineWidth = 1;
    for (let x = 0; x < rect.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y < rect.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    saveCanvasState();
    showToast('Canvas cleared.');
  };

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'text') {
      setTextPosition({ x, y });
      return;
    }

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'eraser') {
      ctx.strokeStyle = '#090e17';
      ctx.lineWidth = lineWidth * 3;
      ctx.globalAlpha = 1.0;
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * 3;
      ctx.globalAlpha = 0.35;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = 1.0;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.closePath();
      ctx.globalAlpha = 1.0;
    }
    saveCanvasState();
  };

  // Commit text label to canvas
  const handleCommitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textPosition || !textInput.trim()) {
      setTextPosition(null);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillStyle = color;
    ctx.globalAlpha = 1.0;
    ctx.fillText(textInput, textPosition.x, textPosition.y);

    setTextInput('');
    setTextPosition(null);
    saveCanvasState();
  };

  // Export & Download
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${diagramTitle.toLowerCase().replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('High-resolution diagram downloaded.');
  };

  // Export to Connected Canva Account
  const handleExportToCanva = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Copy drawing to clipboard or trigger download and launch Canva workspace
    handleDownloadImage();
    const canvaUrl = 'https://www.canva.com/folder/all-designs';
    window.open(canvaUrl, '_blank', 'noopener,noreferrer');
    showToast(`Diagram prepared! Opening ${canvaProfile.email}'s Canva Workspace.`);
  };

  const handleSaveToNotes = () => {
    const notesContent = `ANATOMICAL DIAGRAM: ${diagramTitle}\nCreated on MedStudy Whiteboard\nAccount: ${canvaProfile.email}\nTimestamp: ${new Date().toLocaleString()}`;
    onSaveToNotes?.(diagramTitle, notesContent);
    showToast('Diagram metadata saved to your Notes & Firestore.');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black text-white text-[11px] font-mono uppercase tracking-wider mb-1">
            <Palette className="w-3.5 h-3.5" />
            <span>Interactive Medical Whiteboard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
            Study Canvas &amp; Anatomical Annotation Studio
          </h1>
          <p className="text-xs text-zinc-600">
            Draw, trace, and label anatomical structures. Syncs directly with your connected Canva account (
            <span className="font-semibold text-zinc-800">{canvaProfile.email}</span>).
          </p>
        </div>

        {/* Global Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportToCanva}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Export to Canva</span>
          </button>
          <button
            onClick={handleDownloadImage}
            className="px-3 py-2 rounded-lg border border-zinc-300 hover:border-black text-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors bg-white hover:bg-zinc-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save PNG</span>
          </button>
          <button
            onClick={handleSaveToNotes}
            className="px-3 py-2 rounded-lg border border-zinc-300 hover:border-black text-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors bg-white hover:bg-zinc-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save to Notes</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="px-4 py-2 bg-black text-white text-xs rounded-lg shadow flex items-center justify-between">
          <span>{toastMessage}</span>
          <span className="text-zinc-400 text-[10px]">Just now</span>
        </div>
      )}

      {/* Main Canvas + Control Toolbar */}
      <div className="border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Top Floating Control Bar */}
        <div className="p-3 border-b border-zinc-200 bg-zinc-50 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tools */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-200 shadow-sm">
            <button
              onClick={() => setTool('pen')}
              className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold transition-colors ${
                tool === 'pen' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
              title="Pen (Fine Surgical Drawing)"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pen</span>
            </button>

            <button
              onClick={() => setTool('highlighter')}
              className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold transition-colors ${
                tool === 'highlighter' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
              title="Translucent Anatomical Highlighter"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Highlighter</span>
            </button>

            <button
              onClick={() => setTool('text')}
              className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold transition-colors ${
                tool === 'text' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
              title="Text Annotation Label"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Label</span>
            </button>

            <button
              onClick={() => setTool('eraser')}
              className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold transition-colors ${
                tool === 'eraser' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
              title="Eraser"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eraser</span>
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-zinc-200 shadow-sm">
            {ANATOMICAL_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setColor(c.value)}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  color === c.value ? 'scale-125 border-black shadow' : 'border-zinc-300 hover:scale-110'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>

          {/* Stroke Width Slider */}
          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-zinc-200 shadow-sm">
            <span className="text-[11px] text-zinc-500 font-medium">Stroke:</span>
            <input
              type="range"
              min="2"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-16 h-1 accent-black cursor-pointer"
            />
            <span className="font-mono text-[11px] text-zinc-700 w-4">{lineWidth}</span>
          </div>

          {/* Undo & Clear */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={undoStack.length <= 1}
              className="p-1.5 rounded border border-zinc-200 bg-white hover:border-black text-zinc-700 disabled:opacity-40 transition-colors"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded border border-zinc-200 bg-white hover:border-red-500 hover:text-red-600 text-zinc-700 transition-colors"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Surface */}
        <div className="relative w-full h-[580px] bg-[#090e17] overflow-hidden select-none cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full block"
          />

          {/* Overlay Text Input if Text Tool Active */}
          {textPosition && (
            <form
              onSubmit={handleCommitText}
              className="absolute z-20 flex items-center gap-1 bg-black/90 p-1 rounded-lg border border-zinc-700 shadow-xl"
              style={{ left: textPosition.x, top: textPosition.y }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type anatomical label..."
                autoFocus
                className="px-2 py-1 text-xs bg-zinc-900 text-white border border-zinc-700 rounded focus:outline-none focus:border-white font-mono"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-white text-black text-xs font-bold rounded hover:bg-zinc-200"
              >
                Add
              </button>
            </form>
          )}

          {/* Canvas HUD Legend */}
          <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-400 pointer-events-none flex items-center gap-3 font-mono">
            <span>Grid: 30px</span>
            <span>•</span>
            <span>Active: {tool.toUpperCase()}</span>
            <span>•</span>
            <span style={{ color }}>{color}</span>
          </div>

          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-400 pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Canva Sync Ready ({canvaProfile.email})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
