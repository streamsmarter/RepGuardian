"use client"

export function DashboardHeader() {
  return (
    <div 
      className="relative overflow-hidden rounded-3xl mt-2"
      style={{
        backgroundImage: 'url(/hero_bg_exomesh.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="relative z-10 px-6 py-[72px]">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-white/80">
          Overview of your business performance and recent activity.
        </p>
      </div>
    </div>
  );
}
