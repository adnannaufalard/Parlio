import { useState, useMemo } from 'react'

function UserTable({ users, onEdit, onDelete, pageSize = 10 }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return users.filter(u => (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    ))
  }, [users, query])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, totalPages)

  const paged = useMemo(() => {
    const start = (current - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, current, pageSize])

  const goPrev = () => setPage(p => Math.max(1, p - 1))
  const goNext = () => setPage(p => Math.min(totalPages, p + 1))

  return (
    <div className="w-full">
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input 
            value={query} 
            onChange={(e) => { setQuery(e.target.value); setPage(1) }} 
            placeholder="Cari nama, email, atau role" 
            className="px-3 py-2 border border-gray-300 rounded-md w-full sm:flex-1 sm:max-w-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-black" 
          />

          <div className="flex items-center justify-between sm:justify-end gap-2 text-sm text-gray-600">
            <span className="whitespace-nowrap">{total} hasil</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={goPrev} 
                disabled={current === 1} 
                className="px-2 sm:px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition text-xs sm:text-sm"
              >
                Prev
              </button>
              <span className="px-1 sm:px-2 whitespace-nowrap text-xs sm:text-sm">{current} / {totalPages}</span>
              <button 
                onClick={goNext} 
                disabled={current === totalPages} 
                className="px-2 sm:px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition text-xs sm:text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {total === 0 ? (
          <div className="text-center py-8 text-gray-500">Tidak ada pengguna</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Lengkap</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paged.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{user.full_name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 whitespace-nowrap">{user.email || 'N/A'}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 capitalize whitespace-nowrap">{user.role}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-sm font-medium whitespace-nowrap">
                      <button onClick={() => onEdit(user)} className="text-indigo-600 hover:text-indigo-900 mr-3 transition">Edit</button>
                      <button onClick={() => onDelete(user)} className="text-red-600 hover:text-red-900 transition">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserTable
