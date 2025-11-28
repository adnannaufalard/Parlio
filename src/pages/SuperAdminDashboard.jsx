import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { createUser, updateUser, deleteUser } from '../lib/adminApi'
import UserTable from '../components/UserTable'
import UserFormModal from '../components/UserFormModal'
import { toast } from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'

function SuperAdminDashboard() {
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <DashboardLayout title="Overview">
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Total Users</h3>
            <p className="text-2xl font-semibold mt-2">—</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Active Today</h3>
            <p className="text-2xl font-semibold mt-2">—</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Assignments Due</h3>
            <p className="text-2xl font-semibold mt-2">—</p>
          </div>
        </div>

        <div className="mt-6 lg:mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium">Overview</h3>
          <p className="text-sm text-gray-500 mt-2">Dashboard ringkasan KPI dan grafik akan ditampilkan di sini.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SuperAdminDashboard
