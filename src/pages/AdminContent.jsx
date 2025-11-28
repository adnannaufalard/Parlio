import DashboardLayout from '../components/DashboardLayout'

export default function AdminContent() {
  return (
    <DashboardLayout title="Fitur & Konten">
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
            <h3 className="text-lg font-medium">Courses & Modules</h3>
            <p className="text-sm text-gray-500 mt-2">Kelola kursus, modul, dan struktur pembelajaran.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
            <h3 className="text-lg font-medium">Materials</h3>
            <p className="text-sm text-gray-500 mt-2">Unggah dan atur materi pembelajaran (dokumen, video, dsb).</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
            <h3 className="text-lg font-medium">Gamification</h3>
            <p className="text-sm text-gray-500 mt-2">Tinjau dan konfigurasikan poin/leaderboard/achievements.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
            <h3 className="text-lg font-medium">Assignments</h3>
            <p className="text-sm text-gray-500 mt-2">Buat tugas dan kuis untuk siswa.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
