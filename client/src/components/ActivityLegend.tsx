interface LegendItemProps {
  color: string;
  label: string;
}

function LegendItem({ color, label }: LegendItemProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
      <div style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        backgroundColor: color,
        marginRight: 10,
        boxShadow: `0 0 8px ${color}40`
      }} />
      <span>{label}</span>
    </div>
  );
}

export function ActivityLegend() {
  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      padding: '16px 20px',
      borderRadius: '12px',
      color: '#e5e7eb',
      fontSize: '13px',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h4 style={{
        margin: '0 0 12px 0',
        fontSize: '14px',
        fontWeight: 600,
        color: '#f9fafb'
      }}>
        Activity Legend
      </h4>
      <LegendItem color="#3b82f6" label="Read" />
      <LegendItem color="#f59e0b" label="Write" />
      <LegendItem color="#4b5563" label="Folder" />
      <LegendItem color="#9ca3af" label="File" />
    </div>
  );
}
