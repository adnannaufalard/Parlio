import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import TeacherLayout from '../components/TeacherLayout';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Download, 
  Trash2, 
  Calendar, 
  Users, 
  TrendingUp, 
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  FileSpreadsheet,
  Eye,
  AlertCircle
} from 'lucide-react';

export default function TeacherReports() {
  const [loading, setLoading] = useState(true);
  const [savedReports, setSavedReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch saved reports
      const { data: reports, error: reportsError } = await supabase
        .from('saved_reports')
        .select('*')
        .eq('saved_by', user.id)
        .order('saved_at', { ascending: false });

      if (reportsError) throw reportsError;
      setSavedReports(reports || []);

      // Extract unique class names for filter
      const uniqueClasses = [...new Set(reports?.map(r => r.report_data?.className).filter(Boolean))];
      setClasses(uniqueClasses);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteReport(reportId) {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="font-medium">Hapus laporan ini?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmDeleteReport(reportId);
            }}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Hapus
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            Batal
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  }

  async function confirmDeleteReport(reportId) {
    try {
      setDeletingId(reportId);
      const { error } = await supabase
        .from('saved_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setSavedReports(prev => prev.filter(r => r.id !== reportId));
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
      toast.success('Laporan berhasil dihapus');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Gagal menghapus laporan');
    } finally {
      setDeletingId(null);
    }
  }

  function handleExportCSV() {
    if (!selectedReport?.report_data) return;
    
    setExporting(true);
    try {
      const data = selectedReport.report_data;
      const questColumns = data.questColumns || [];
      
      // Build headers
      const headers = ['No', 'Nama Siswa', 'Kelas', 'Email'];
      questColumns.forEach(q => headers.push(q.title));
      headers.push('Rata-rata', 'Status');
      
      // Build rows
      const rows = data.students?.map((student, index) => {
        const row = [
          index + 1,
          student.name,
          student.className || data.className || '-',
          student.email || '-'
        ];
        
        questColumns.forEach(q => {
          const score = student.questScores?.[q.id];
          row.push(score !== undefined ? score : '-');
        });
        
        row.push(student.score?.toFixed(1) || '-');
        row.push(student.status || (student.passed ? 'Lulus' : 'Tidak Lulus'));
        
        return row;
      }) || [];
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedReport.report_name.replace(/\s+/g, '_')}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Gagal mengekspor CSV');
    } finally {
      setExporting(false);
    }
  }

  // Filter reports based on search and class filter
  const filteredReports = savedReports.filter(report => {
    const matchesSearch = report.report_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.report_data?.className?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'all' || report.report_data?.className === filterClass;
    return matchesSearch && matchesClass;
  });

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Memuat data laporan...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-green-500 rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl"></span>
              <div>
                <h1 className="text-2xl font-bold">Laporan Nilai</h1>
                <p className="text-indigo-100">Kelola dan unduh laporan nilai siswa</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">{savedReports.length} Laporan Tersimpan</span>
            </div>
          </div>
        </div>

        {savedReports.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Belum Ada Laporan Tersimpan</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Laporan akan muncul di sini setelah Anda menyimpan laporan nilai dari halaman detail materi (Quest & Hasil).
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-lg mx-auto">
              <div className="flex items-start gap-3 text-left">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Cara menyimpan laporan:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-600">
                    <li>Buka salah satu kelas</li>
                    <li>Pilih bab/chapter</li>
                    <li>Buka materi/lesson</li>
                    <li>Klik tab "Quest & Hasil"</li>
                    <li>Klik tombol "Simpan Laporan"</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Panel - Report List */}
            <div className="lg:col-span-1 space-y-4">
              {/* Search & Filter */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari laporan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                
                {classes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="all">Semua Kelas</option>
                      {classes.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Reports List */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Daftar Laporan ({filteredReports.length})
                  </h3>
                </div>
                
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {filteredReports.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      Tidak ada laporan ditemukan
                    </div>
                  ) : (
                    filteredReports.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${
                          selectedReport?.id === report.id 
                            ? 'bg-indigo-50 border-l-4 border-l-indigo-500' 
                            : 'border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium truncate ${
                              selectedReport?.id === report.id ? 'text-indigo-700' : 'text-slate-800'
                            }`}>
                              {report.report_name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                                <Users className="w-3 h-3" />
                                {report.report_data?.stats?.totalStudents || 0} siswa
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded text-xs text-green-700">
                                <TrendingUp className="w-3 h-3" />
                                {report.report_data?.stats?.avgScore?.toFixed(1) || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              {formatDate(report.saved_at)}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReport(report.id);
                            }}
                            disabled={deletingId === report.id}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus laporan"
                          >
                            {deletingId === report.id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Report Detail */}
            <div className="lg:col-span-2">
              {selectedReport ? (
                <div className="space-y-6">
                  {/* Report Header */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">{selectedReport.report_name}</h2>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                            <Calendar className="w-4 h-4" />
                            {formatDate(selectedReport.saved_at)}
                          </span>
                          {selectedReport.report_data?.className && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium">
                              {selectedReport.report_data.className}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleExportCSV}
                        disabled={exporting}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all disabled:opacity-50"
                      >
                        {exporting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Mengekspor...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Export CSV
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Total Siswa</p>
                          <p className="text-2xl font-bold text-slate-800">
                            {selectedReport.report_data?.stats?.totalStudents || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 rounded-lg">
                          <BarChart3 className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Rata-rata</p>
                          <p className="text-2xl font-bold text-slate-800">
                            {selectedReport.report_data?.stats?.avgScore?.toFixed(1) || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Lulus</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {selectedReport.report_data?.stats?.passedCount || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-100 rounded-lg">
                          <XCircle className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Tidak Lulus</p>
                          <p className="text-2xl font-bold text-rose-600">
                            {(selectedReport.report_data?.stats?.totalStudents || 0) - (selectedReport.report_data?.stats?.passedCount || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedReport.notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Catatan</p>
                          <p className="text-sm text-amber-700 mt-1">{selectedReport.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Data Table */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Detail Nilai Siswa
                      </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">No</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nama Siswa</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Kelas</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                            {selectedReport.report_data?.questColumns?.map(quest => (
                              <th key={quest.id} className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                                {quest.title}
                              </th>
                            ))}
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Rata-rata</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedReport.report_data?.students?.map((student, index) => (
                            <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3.5 text-sm text-slate-500">{index + 1}</td>
                              <td className="px-4 py-3.5">
                                <p className="text-sm font-medium text-slate-800">{student.name}</p>
                              </td>
                              <td className="px-4 py-3.5 text-sm text-slate-600">
                                {student.className || selectedReport.report_data?.className || '-'}
                              </td>
                              <td className="px-4 py-3.5 text-sm text-slate-500">{student.email || '-'}</td>
                              {selectedReport.report_data?.questColumns?.map(quest => {
                                const score = student.questScores?.[quest.id];
                                return (
                                  <td key={quest.id} className="px-4 py-3.5 text-center">
                                    {score !== undefined ? (
                                      <span className={`inline-flex items-center justify-center w-10 h-7 rounded text-sm font-medium ${
                                        score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                      }`}>
                                        {score}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">-</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-sm font-bold ${
                                  student.score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {student.score?.toFixed(1) || '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                  student.passed || student.status === 'Lulus'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {student.passed || student.status === 'Lulus' ? (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      Lulus
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3.5 h-3.5" />
                                      Tidak Lulus
                                    </>
                                  )}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {(!selectedReport.report_data?.students || selectedReport.report_data.students.length === 0) && (
                      <div className="p-8 text-center text-slate-500">
                        <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p>Tidak ada data siswa</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* No Report Selected State */
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center min-h-[500px]">
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Pilih Laporan</h3>
                  <p className="text-slate-500 max-w-sm">
                    Pilih salah satu laporan dari daftar di sebelah kiri untuk melihat detail nilai siswa.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
