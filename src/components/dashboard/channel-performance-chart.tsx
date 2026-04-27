'use client';

interface ChannelPerformanceChartProps {
  clicksCount?: number;
  conversionsCount?: number;
  clickThroughRate?: number;
  conversionRate?: number;
}

// Create smooth curve using cubic bezier (Catmull-Rom spline)
const smoothPath = (pts: {x: number, y: number}[]) => {
  if (pts.length < 2) return '';
  let path = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
};

export function ChannelPerformanceChart({ clicksCount = 0, conversionsCount = 0, clickThroughRate = 0, conversionRate = 0 }: ChannelPerformanceChartProps) {
  const totalClicks = clicksCount;
  const totalConversions = conversionsCount;

  // Generate a simple visualization based on the totals
  const maxValue = Math.max(totalClicks, totalConversions, 1);
  const clicksHeight = 100 - (totalClicks / maxValue) * 80;
  const conversionsHeight = 100 - (totalConversions / maxValue) * 80;

  // Create smooth curve points
  const clicksPoints = [
    { x: 0, y: 100 },
    { x: 25, y: 90 },
    { x: 50, y: clicksHeight },
    { x: 75, y: clicksHeight + 10 },
    { x: 100, y: clicksHeight }
  ];
  const conversionsPoints = [
    { x: 0, y: 100 },
    { x: 25, y: 95 },
    { x: 50, y: conversionsHeight },
    { x: 75, y: conversionsHeight + 5 },
    { x: 100, y: conversionsHeight }
  ];

  const clicksPath = smoothPath(clicksPoints);
  const conversionsPath = smoothPath(conversionsPoints);
  const clicksAreaPath = `${clicksPath} L100 100 L0 100 Z`;
  const conversionsAreaPath = `${conversionsPath} L100 100 L0 100 Z`;

  return (
    <div className="col-span-1 md:col-span-12 bg-[#1a1919] rounded-xl p-4 md:p-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Channel Performance</h3>
          <p className="text-base md:text-lg font-bold">Clicks vs. Conversions</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#8596ff]"></span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">CTR</span>
            <span className="text-sm font-bold text-[#8596ff]">{(clickThroughRate * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary"></span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Conv.</span>
            <span className="text-sm font-bold text-primary">{(conversionRate * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
      
      {/* SVG Dual Line Chart */}
      <div className="h-48 md:h-64 relative">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          {/* Grid Lines */}
          <line className="stroke-[#484847]/10" x1="0" x2="100" y1="25" y2="25"></line>
          <line className="stroke-[#484847]/10" x1="0" x2="100" y1="50" y2="50"></line>
          <line className="stroke-[#484847]/10" x1="0" x2="100" y1="75" y2="75"></line>
          
          {/* Area Fills */}
          <path 
            className="fill-[#8596ff]/5" 
            d={clicksAreaPath}
            vectorEffect="non-scaling-stroke"
          />
          <path 
            className="fill-primary/10" 
            d={conversionsAreaPath}
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Clicks Line (Slate Blue) */}
          <path 
            className="stroke-[#8596ff] fill-none" 
            strokeWidth="1.5"
            d={clicksPath}
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Conversions Line (Primary Green) */}
          <path 
            className="stroke-primary fill-none" 
            strokeWidth="2"
            d={conversionsPath}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
