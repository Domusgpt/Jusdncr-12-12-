/**
 * CollapsibleControlPanel - Smart collapsible panel base
 *
 * Non-occluding panels that live in the bottom 30% of screen:
 * - Collapsible to just a tab/handle
 * - Can stack without blocking each other
 * - Touch-friendly with haptic-style feedback
 * - Positioned: left, center, right
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';

export type PanelPosition = 'left' | 'center' | 'right';

interface CollapsibleControlPanelProps {
  // Identity
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string; // e.g., 'cyan', 'purple', 'pink'

  // State
  isOpen: boolean;
  isExpanded: boolean;
  onToggleOpen: () => void;
  onToggleExpand: () => void;

  // Position
  position: PanelPosition;

  // Content
  children: React.ReactNode;

  // Optional compact view when collapsed but open
  compactContent?: React.ReactNode;
}

// Color map for consistent theming
const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  cyan: {
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/50',
    text: 'text-cyan-400',
    glow: 'shadow-[0_0_20px_rgba(0,255,255,0.3)]'
  },
  purple: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]'
  },
  pink: {
    bg: 'bg-pink-500/20',
    border: 'border-pink-500/50',
    text: 'text-pink-400',
    glow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]'
  },
  orange: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]'
  }
};

// Position styles
const positionStyles: Record<PanelPosition, string> = {
  left: 'left-2',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-2'
};

export const CollapsibleControlPanel: React.FC<CollapsibleControlPanelProps> = ({
  id,
  title,
  icon,
  color,
  isOpen,
  isExpanded,
  onToggleOpen,
  onToggleExpand,
  position,
  children,
  compactContent
}) => {
  const colors = colorMap[color] || colorMap.cyan;
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate bottom offset based on position to avoid overlap
  const bottomOffset = position === 'center' ? 'bottom-20' : 'bottom-2';

  if (!isOpen) {
    // Collapsed tab - just a small handle
    return (
      <button
        onClick={onToggleOpen}
        className={`fixed ${bottomOffset} ${positionStyles[position]} z-40
                   ${colors.bg} ${colors.border} ${colors.text}
                   border rounded-xl px-3 py-2
                   flex items-center gap-2
                   hover:scale-105 active:scale-95
                   transition-all duration-200
                   backdrop-blur-xl font-rajdhani`}
      >
        {icon}
        <span className="text-xs font-bold tracking-wider">{title}</span>
        <ChevronUp className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      className={`fixed ${bottomOffset} ${positionStyles[position]} z-40
                 bg-black/80 backdrop-blur-xl
                 border ${colors.border} rounded-2xl
                 font-rajdhani text-white
                 transition-all duration-200 ease-out
                 ${isExpanded ? 'max-w-[95vw]' : 'max-w-[280px]'}
                 ${isExpanded ? colors.glow : ''}`}
      style={{
        maxHeight: isExpanded ? '35vh' : '120px',
      }}
    >
      {/* Header - always visible */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b border-white/10
                   cursor-pointer select-none`}
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <div className={`${colors.text}`}>{icon}</div>
          <span className={`text-sm font-bold tracking-wider ${colors.text}`}>
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Expand/Collapse */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleOpen(); }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`overflow-hidden transition-all duration-200
                      ${isExpanded ? 'max-h-[30vh] overflow-y-auto' : 'max-h-[60px]'}`}>
        {isExpanded ? (
          <div className="p-3">
            {children}
          </div>
        ) : (
          <div className="p-2">
            {compactContent || (
              <div className="text-xs text-white/40 text-center">
                Tap to expand
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MINI CONTROL PAD - For quick touch controls in compact mode
// =============================================================================

interface MiniPadProps {
  items: {
    id: string;
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    color?: string;
    onClick: () => void;
  }[];
}

export const MiniControlPad: React.FC<MiniPadProps> = ({ items }) => {
  return (
    <div className="flex gap-1 justify-center">
      {items.map((item) => {
        const colors = colorMap[item.color || 'cyan'];
        return (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`w-10 h-10 rounded-lg flex items-center justify-center
                       transition-all active:scale-90
                       ${item.isActive
                         ? `${colors.bg} ${colors.border} ${colors.text} border`
                         : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'
                       }`}
            title={item.label}
          >
            {item.icon}
          </button>
        );
      })}
    </div>
  );
};

export default CollapsibleControlPanel;
