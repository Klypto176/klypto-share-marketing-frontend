import React from 'react';
import { LuMousePointer2, LuTrash2, LuMinus } from 'react-icons/lu';
import { BsGraphUpArrow } from 'react-icons/bs';
import { MdTimeline } from 'react-icons/md';

const DrawingToolbar = ({ activeTool, setActiveTool, clearAllDrawings }) => {
  const tools = [
    {
      id: 'cursor',
      icon: <LuMousePointer2 size={16} />,
      title: 'Cursor'
    },
    {
      id: 'trendLine',
      icon: <MdTimeline size={16} />,
      title: 'Trend Line'
    },
    {
      id: 'horizontalLine',
      icon: <LuMinus size={16} />,
      title: 'Horizontal Line'
    }
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '40px',
        height: '100%',
        flexShrink: 0,
        backgroundColor: 'var(--bg-primary)',
        borderRight: '1px solid var(--border-color)',
        padding: '16px 0',
        alignItems: 'center',
        gap: '20px'
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.id}
          title={tool.title}
          onClick={() => setActiveTool(tool.id)}
          style={{
            background: 'none',
            border: 'none',
            color: activeTool === tool.id ? '#2962FF' : '#94a3b8',
            cursor: 'pointer',
            padding: 0,
            width: '16px',
            height: '16px',
            borderRadius: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'all 0.2s',
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            if (activeTool !== tool.id) e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            if (activeTool !== tool.id) e.currentTarget.style.color = '#94a3b8';
          }}
        >
          {tool.icon}
        </button>
      ))}

      <div style={{ height: '1px', width: '16px', backgroundColor: 'var(--border-color)' }} />

      <button
        title="Clear All Drawings"
        onClick={clearAllDrawings}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: 0,
          width: '16px',
          height: '16px',
          borderRadius: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
      >
        <LuTrash2 size={16} />
      </button>
    </div>
  );
};

export default DrawingToolbar;
