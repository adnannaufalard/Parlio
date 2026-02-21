/**
 * StudentReward.jsx (StudentStore)
 * Halaman Store untuk Siswa
 * Tempat menukarkan Coins untuk produk dari guru
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, ShoppingBag, Coins, Package, Clock, CheckCircle2, XCircle, History } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentReward() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [myPurchases, setMyPurchases] = useState([])
  const [userCoins, setUserCoins] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [purchasing, setPurchasing] = useState(false)
  const [activeTab, setActiveTab] = useState('store') // 'store' or 'history'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      // Get user coins
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single()

      setUserCoins(profile?.coins || 0)

      // Get student's classes
      const { data: memberships } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('student_id', user.id)

      const classIds = memberships?.map(m => m.class_id) || []

      // Get active products from teachers of student's classes
      if (classIds.length > 0) {
        // Get teacher IDs from classes
        const { data: classes } = await supabase
          .from('classes')
          .select('teacher_id')
          .in('id', classIds)

        const teacherIds = [...new Set(classes?.map(c => c.teacher_id) || [])]

        if (teacherIds.length > 0) {
          const { data: productsData } = await supabase
            .from('store_products')
            .select('*, teacher:profiles!store_products_teacher_fkey(id, full_name)')
            .in('teacher_id', teacherIds)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

          setProducts(productsData || [])
        }
      }

      // Get student's purchase history
      const { data: purchases } = await supabase
        .from('store_purchases')
        .select('*, product:store_products(id, product_name, image_url, coin_price)')
        .eq('student_id', user.id)
        .order('purchased_at', { ascending: false })

      setMyPurchases(purchases || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!selectedProduct) return

    if (userCoins < selectedProduct.coin_price) {
      toast.error('Koin tidak cukup')
      return
    }

    setPurchasing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Create purchase record
      const { error: purchaseError } = await supabase
        .from('store_purchases')
        .insert([{
          student_id: user.id,
          product_id: selectedProduct.id,
          coins_spent: selectedProduct.coin_price,
          status: 'pending'
        }])

      if (purchaseError) throw purchaseError

      // Deduct coins from user
      const { error: coinsError } = await supabase
        .from('profiles')
        .update({ coins: userCoins - selectedProduct.coin_price })
        .eq('id', user.id)

      if (coinsError) throw coinsError

      toast.success('Penukaran berhasil! Menunggu konfirmasi guru.')
      setUserCoins(prev => prev - selectedProduct.coin_price)
      setSelectedProduct(null)
      fetchData()
    } catch (error) {
      console.error('Error purchasing:', error)
      toast.error('Gagal melakukan pembelian')
    } finally {
      setPurchasing(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Menunggu</Badge>
      case 'approved':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" /> Disetujui</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Ditolak</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout>
      <div className="space-y-4 pb-6">
        {/* Header with Coins */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Store</h1>
                  <p className="text-purple-100 text-sm">Tukarkan koin dengan hadiah menarik</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-300" />
                <span className="text-xl font-bold">{userCoins}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'store' ? 'default' : 'outline'}
            onClick={() => setActiveTab('store')}
            className="flex-1"
          >
            <Package className="h-4 w-4 mr-2" />
            Produk
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className="flex-1"
          >
            <History className="h-4 w-4 mr-2" />
            Riwayat
          </Button>
        </div>

        {/* Store Tab */}
        {activeTab === 'store' && (
          <div>
            {products.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Produk</h3>
                  <p className="text-sm text-gray-500">Produk dari guru akan muncul di sini</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {products.map((product) => (
                  <Card 
                    key={product.id} 
                    className="border-0 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-sm truncate">{product.product_name}</h3>
                          <p className="text-xs text-gray-500 truncate">{product.teacher?.full_name}</p>
                          <div className="flex items-center gap-1 mt-1 text-yellow-600 font-bold text-sm">
                            <Coins className="h-3.5 w-3.5" />
                            <span>{product.coin_price}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {product.stock !== -1 && product.stock <= 5 && product.stock > 0 && (
                            <Badge className="bg-orange-100 text-orange-700 text-xs">
                              Sisa {product.stock}
                            </Badge>
                          )}
                          {product.stock === 0 && (
                            <Badge className="bg-red-100 text-red-700 text-xs">Habis</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            {myPurchases.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-12">
                  <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Penukaran</h3>
                  <p className="text-sm text-gray-500">Riwayat penukaran Anda akan muncul di sini</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myPurchases.map((purchase) => (
                  <Card key={purchase.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {purchase.product?.image_url ? (
                            <img 
                              src={purchase.product.image_url} 
                              alt={purchase.product.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {purchase.product?.product_name || 'Produk'}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-yellow-600">
                            <Coins className="h-3 w-3" />
                            <span>{purchase.coins_spent}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(purchase.purchased_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          {getStatusBadge(purchase.status)}
                        </div>
                      </div>
                      {purchase.notes && (
                        <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                          {purchase.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Purchase Confirmation Dialog */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Konfirmasi Penukaran</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {selectedProduct.image_url ? (
                    <img 
                      src={selectedProduct.image_url} 
                      alt={selectedProduct.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedProduct.product_name}</h3>
                  {selectedProduct.description && (
                    <p className="text-sm text-gray-600 mt-1">{selectedProduct.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Dari: {selectedProduct.teacher?.full_name}</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm text-gray-600">Harga</span>
                  <div className="flex items-center gap-1 text-yellow-600 font-bold">
                    <Coins className="h-5 w-5" />
                    <span className="text-lg">{selectedProduct.coin_price}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Koin Anda</span>
                  <span className={`font-bold ${userCoins >= selectedProduct.coin_price ? 'text-green-600' : 'text-red-600'}`}>
                    {userCoins}
                  </span>
                </div>
                {userCoins < selectedProduct.coin_price && (
                  <p className="text-sm text-red-600 text-center">Koin tidak cukup untuk menukar produk ini</p>
                )}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                Batal
              </Button>
              <Button 
                onClick={handlePurchase}
                disabled={purchasing || !selectedProduct || userCoins < selectedProduct?.coin_price || selectedProduct?.stock === 0}
              >
                {purchasing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Coins className="h-4 w-4 mr-2" />}
                Tukar Sekarang
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  )
}
