import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { createUser, updateUser, deleteUser } from '../lib/adminApi'
import UserTable from '../components/UserTable'
import UserFormModal from '../components/UserFormModal'
import { toast } from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['guru', 'siswa'])
    if (error) {
      setError('Failed to fetch users')
      console.error(error)
    } else {
      setUsers(data)
    }
    setLoading(false)
  }

  const handleCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (user) => {
    setEditing(user)
    setModalOpen(true)
  }

  const handleDelete = async (user) => {
    if (!confirm(`Hapus pengguna ${user.full_name}?`)) return
    try {
      await deleteUser({ id: user.id })
      setSuccess('Pengguna dihapus')
      toast.success('Pengguna dihapus')
      fetchUsers()
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    }
  }

  const handleSubmit = async (form) => {
    setError('')
    setSuccess('')
    try {
      if (editing) {
        await updateUser({ id: editing.id, full_name: form.fullName, email: form.email, role: form.role })
        setSuccess('Pengguna diperbarui')
        toast.success('Pengguna diperbarui')
      } else {
        await createUser({ full_name: form.fullName, email: form.email, password: form.password, role: form.role })
        setSuccess('Pengguna dibuat')
        toast.success('Pengguna dibuat')
      }
      setModalOpen(false)
      fetchUsers()
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    }
  }

  return (
    <DashboardLayout title="User Management">
      <div className="w-full">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-sm">{success}</div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold">Daftar Pengguna</h2>
            <button onClick={handleCreate} className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition text-sm font-medium">
              Buat Pengguna
            </button>
          </div>

          {loading ? (
            <div className="p-6"><p>Memuat...</p></div>
          ) : (
            <UserTable users={users} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </div>

        <UserFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} initialData={editing} />
      </div>
    </DashboardLayout>
  )
}
