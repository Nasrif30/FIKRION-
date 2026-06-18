import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X } from 'lucide-react';

// Custom frameless title bar — required because decorations: false in tauri.conf.json
// The drag-region class enables Tauri window dragging via CSS.
export default function TitleBar() {
  return (
    <div
      className="flex items-center justify-between h-9 px-4 shrink-0 drag-region select-none"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* Left: spacer so traffic lights area is empty */}
      <div className="w-24" />

      {/* Center: empty — FIKRION branding is in the sidebar */}
      <div />

      {/* Right: window controls */}
      <div className="flex items-center gap-1 no-drag">
        <WindowBtn onClick={() => getCurrentWindow().minimize()} title="Minimize">
          <Minus size={11} />
        </WindowBtn>
        <WindowBtn onClick={() => getCurrentWindow().toggleMaximize()} title="Maximize">
          <Square size={10} />
        </WindowBtn>
        <WindowBtn onClick={() => getCurrentWindow().close()} title="Close" danger>
          <X size={11} />
        </WindowBtn>
      </div>
    </div>
  );
}

function WindowBtn({
  children, onClick, title, danger,
}: {
  children: React.ReactNode; onClick: () => void; title: string; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors duration-150 ${
        danger
          ? 'text-tertiary hover:bg-threat/20 hover:text-threat'
          : 'text-tertiary hover:bg-white/8 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
