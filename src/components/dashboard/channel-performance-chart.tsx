'use client';

interface ChannelPerformanceChartProps {
  clicksCount?: number;
  conversionsCount?: number;
}

export function ChannelPerformanceChart({ clicksCount = 0, conversionsCount = 0 }: ChannelPerformanceChartProps) {
  const totalClicks = clicksCount;
  const totalConversions = conversionsCount;

  // Generate a simple visualization based on the totals
  const maxValue = Math.max(totalClicks, totalConversions, 1);
  const clicksHeight = 100 - (totalClicks / maxValue) * 80;
  const conversionsHeight = 100 - (totalConversions / maxValue) * 80;

  // Simple path showing the values
  const clicksPath = `M0 100 L30 100 L50 ${clicksHeight} L70 ${clicksHeight + 10} L100 ${clicksHeight}`;
  const conversionsPath = `M0 100 L30 100 L50 ${conversionsHeight} L70 ${conversionsHeight + 5} L100 ${conversionsHeight}`;
  const clicksAreaPath = `${clicksPath} V 100 H 0 Z`;
  const conversionsAreaPath = `${conversionsPath} V 100 H 0 Z`;

  return (
    <div className="col-span-12 bg-[#1a1919] rounded-xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Channel Performance</h3>
          <p className="text-lg font-bold">Clicks vs. Conversions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#8596ff]"></span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Clicks</span>
            <span className="text-sm font-bold text-[#8596ff]">{totalClicks}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary"></span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Conversions</span>
            <span className="text-sm font-bold text-primary">{totalConversions}</span>
          </div>
        </div>
      </div>
      
      {/* SVG Dual Line Chart */}
      <div className="h-64 relative">
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
