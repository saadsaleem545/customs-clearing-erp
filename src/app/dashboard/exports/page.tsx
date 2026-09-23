import ExportGdForm from '@/components/ExportGdForm';

export default function ExportsPage() {
  return (
    <div className="p-6 text-slate-100 min-h-screen">
      {/* Custom Sleek Scrollbars Styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #020617;
          }
          ::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 9999px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
        `
      }} />

      <h1 className="text-3xl font-bold mb-6 text-white">Exports Management</h1>
      <ExportGdForm />
    </div>
  );
}