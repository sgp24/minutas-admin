export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <p className="text-white/60 text-lg">Bienvenido al panel de administración.</p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl border border-white/5 bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
