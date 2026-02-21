/**
 * TeacherStore.jsx
 * Halaman Store untuk Guru
 * 
 * Fitur:
 * - Menambahkan produk yang dapat ditukar siswa dengan coin
 * - Upload gambar produk
 * - Kelola stok dan harga
 * - Melihat riwayat penukaran siswa
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import toast from 'react-hot-toast'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  ShoppingBag, 
  Plus, 
  Coins, 
  Package, 
  History, 
  Edit, 
  Trash2, 
  Upload, 
  Check, 
  X,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

function TeacherStore() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [purchases, setPurchases] = useState([])
  const [activeTab, setActiveTab] = useState('products')
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productStock, setProductStock] = useState('-1')
  const [productImage, setProductImage] = useState(null)
  const [productImagePreview, setProductImagePreview] = useState('')
  const [saving, setSaving] = useState(false)
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchProducts()
    fetchPurchases()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all purchases for teacher's products
      // First get products for this teacher
      const { data: teacherProducts } = await supabase
        .from('store_products')
        .select('id')
        .eq('teacher_id', user.id)

      if (!teacherProducts?.length) {
        setPurchases([])
        return
      }

      const productIds = teacherProducts.map(p => p.id)

      const { data, error } = await supabase
        .from('store_purchases')
        .select(`
          *,
          product:store_products(
            id,
            product_name,
            coin_price,
            teacher_id,
            image_url
          )
        `)
        .in('product_id', productIds)
        .order('purchased_at', { ascending: false })

      if (error) throw error
      
      // Fetch student profiles separately
      const studentIds = [...new Set((data || []).map(p => p.student_id))]
      let studentMap = {}
      
      if (studentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', studentIds)
        
        studentMap = Object.fromEntries((studentsData || []).map(s => [s.id, s]))
      }
      
      // Merge student data
      const purchasesWithStudents = (data || []).map(p => ({
        ...p,
        student: studentMap[p.student_id] || null
      }))
      
      setPurchases(purchasesWithStudents)
    } catch (error) {
      console.error('Error fetching purchases:', error)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran gambar maksimal 5MB')
        return
      }
      setProductImage(file)
      setProductImagePreview(URL.createObjectURL(file))
    }
  }

  const uploadImage = async (file) => {
    const { data: { user } } = await supabase.auth.getUser()
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleSaveProduct = async () => {
    if (!productName.trim()) {
      toast.error('Nama produk harus diisi')
      return
    }

    if (!productPrice || parseInt(productPrice) < 0) {
      toast.error('Harga harus valid')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      let imageUrl = editingProduct?.image_url || null

      // Upload image if new one selected
      if (productImage) {
        imageUrl = await uploadImage(productImage)
      }

      const productData = {
        teacher_id: user.id,
        product_name: productName.trim(),
        description: productDescription.trim() || null,
        coin_price: parseInt(productPrice),
        stock: parseInt(productStock),
        image_url: imageUrl,
        is_active: true
      }

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('store_products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
        toast.success('Produk berhasil diperbarui')
      } else {
        // Create new product
        const { error } = await supabase
          .from('store_products')
          .insert([productData])

        if (error) throw error
        toast.success('Produk berhasil ditambahkan')
      }

      resetForm()
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Gagal menyimpan produk')
    } finally {
      setSaving(false)
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setProductName(product.product_name)
    setProductDescription(product.description || '')
    setProductPrice(product.coin_price.toString())
    setProductStock(product.stock.toString())
    setProductImagePreview(product.image_url || '')
    setShowProductModal(true)
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Hapus produk ini?')) return

    try {
      const { error } = await supabase
        .from('store_products')
        .update({ is_active: false })
        .eq('id', productId)

      if (error) throw error
      toast.success('Produk berhasil dihapus')
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Gagal menghapus produk')
    }
  }

  const handleProcessPurchase = async (purchaseId, status) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('store_purchases')
        .update({
          status,
          processed_at: new Date().toISOString(),
          processed_by: user.id
        })
        .eq('id', purchaseId)

      if (error) throw error

      toast.success(status === 'approved' ? 'Penukaran disetujui' : 'Penukaran ditolak')
      fetchPurchases()
    } catch (error) {
      console.error('Error processing purchase:', error)
      toast.error('Gagal memproses penukaran')
    }
  }

  const resetForm = () => {
    setShowProductModal(false)
    setEditingProduct(null)
    setProductName('')
    setProductDescription('')
    setProductPrice('')
    setProductStock('-1')
    setProductImage(null)
    setProductImagePreview('')
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" /> Menunggu</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" /> Disetujui</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" /> Ditolak</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700"><Check className="h-3 w-3 mr-1" /> Selesai</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">Store</h1>
                <p className="text-emerald-100">Kelola produk yang dapat ditukar siswa dengan coin</p>
              </div>
            </div>
            <Button 
              className="bg-white text-emerald-600 hover:bg-emerald-50"
              onClick={() => setShowProductModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Produk
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{products.filter(p => p.is_active).length}</p>
            <p className="text-sm text-gray-500">Total Produk</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {purchases.filter(p => p.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-500">Menunggu Proses</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {purchases.filter(p => p.status === 'approved' || p.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-500">Disetujui</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {purchases.filter(p => p.status === 'approved' || p.status === 'completed').reduce((sum, p) => sum + p.coins_spent, 0)}
            </p>
            <p className="text-sm text-gray-500">Total Coins Ditukar</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produk
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Riwayat Penukaran
              {purchases.filter(p => p.status === 'pending').length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {purchases.filter(p => p.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : products.filter(p => p.is_active).length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Belum Ada Produk</h3>
                <p className="text-gray-500 mb-6">Tambahkan produk yang dapat ditukar siswa dengan coin mereka</p>
                <Button onClick={() => setShowProductModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Produk Pertama
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.filter(p => p.is_active).map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="aspect-video bg-gray-100 relative">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full font-semibold">
                            Stok Habis
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-1">{product.product_name}</h3>
                      {product.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-600 font-bold">
                          <Coins className="h-4 w-4" />
                          {product.coin_price}
                        </div>
                        <div className="text-sm text-gray-500">
                          Stok: {product.stock === -1 ? '∞' : product.stock}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases">
            {purchases.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Belum Ada Penukaran</h3>
                <p className="text-gray-500">Siswa belum melakukan penukaran produk</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Siswa</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Produk</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Coins</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {purchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={purchase.student?.avatar_url} />
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                                  {purchase.student?.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-800 text-sm">{purchase.student?.full_name}</p>
                                <p className="text-xs text-gray-500">{purchase.student?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-800">{purchase.product?.product_name}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                              <Coins className="h-4 w-4" />
                              {purchase.coins_spent}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-500">
                            {new Date(purchase.purchased_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(purchase.status)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {purchase.status === 'pending' && (
                              <div className="flex items-center justify-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() => handleProcessPurchase(purchase.id, 'approved')}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => handleProcessPurchase(purchase.id, 'rejected')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Product Modal */}
        <Dialog open={showProductModal} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </DialogTitle>
              <DialogDescription>
                Produk akan dapat ditukar oleh siswa dengan coin mereka
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Gambar Produk</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {productImagePreview ? (
                    <img 
                      src={productImagePreview} 
                      alt="Preview" 
                      className="w-full h-32 object-contain mx-auto"
                    />
                  ) : (
                    <div className="py-4">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Klik untuk upload gambar</p>
                      <p className="text-xs text-gray-400">Max 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productName">Nama Produk *</Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="contoh: Pulpen, Buku Tulis"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productDescription">Deskripsi</Label>
                <Textarea
                  id="productDescription"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Deskripsi produk (opsional)"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productPrice">Harga (Coins) *</Label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                    <Input
                      id="productPrice"
                      type="number"
                      min="0"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="50"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productStock">Stok</Label>
                  <Select value={productStock} onValueChange={setProductStock}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-1">Tidak terbatas</SelectItem>
                      <SelectItem value="0">Habis (0)</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Batal
              </Button>
              <Button onClick={handleSaveProduct} disabled={saving}>
                {saving ? 'Menyimpan...' : editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TeacherLayout>
  )
}

export default TeacherStore
