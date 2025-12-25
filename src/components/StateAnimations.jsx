/**
 * StateAnimations.jsx
 * Reusable animated state components using Lottie animations
 * 
 * Components:
 * - LoadingSpinner: Simple spinning loader
 * - LoadingPage: Full page loading state
 * - LoadingCard: Card skeleton loader
 * - EmptyState: No data available
 * - NotFound: 404 page not found
 * - ErrorState: Error occurred
 * - SuccessState: Success confirmation
 * - ComingSoon: Feature not yet available
 * - NoConnection: Network error
 * - Maintenance: Under maintenance
 * 
 * HOW TO USE LOTTIE:
 * 1. Install: npm install lottie-react
 * 2. Get animation JSON URL from https://lottiefiles.com
 * 3. Replace the placeholder URLs below with your Lottie JSON URLs
 * 
 * @module StateAnimations
 */

import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

/**
 * Primary color constant
 */
const PRIMARY_COLOR = '#1E258F'

/**
 * ========================================
 * LOTTIE ANIMATION URLs - EDIT THESE!
 * ========================================
 * Replace these placeholder URLs with your Lottie JSON URLs from lottiefiles.com
 * Example: 'https://lottie.host/xxxxx/animation.json'
 */
const LOTTIE_URLS = {
  loading: 'https://lottie.host/a97ee9dd-77be-40cd-b148-8577e6cd6356/P6C2DoJ7EW.lottie',
  empty: 'https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie',
  notFound: 'https://lottie.host/21813476-2820-4553-b40f-e51e92062a0b/SkBcD6XvwU.lottie',
  error: 'https://lottie.host/0ca7cbf8-147a-4a2b-9f87-622d75c16573/AypRkf7Ag1.lottie',
  success: 'https://lottie.host/b2ccd7d2-0d77-48a7-b74a-2e3841146ab8/mki4HER6In.lottie',
  comingSoon: 'https://lottie.host/6f99306d-dc12-4edb-af32-78bb1396d80a/TN0ZUIUsYz.lottie',
  noConnection: 'https://lottie.host/8bef6ddf-13d4-4a32-9218-d22feca28c18/rD5SbkL0e5.lottie',
  maintenance: 'https://lottie.host/abc388c6-6494-4f68-866e-0dd7a6bf4c66/cLcalSiGpL.lottie',
}

/**
 * Hook to fetch Lottie animation data from URL
 */
function useLottieAnimation(url) {
  const [animationData, setAnimationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!url || url.includes('YOUR_')) {
      setLoading(false)
      setError(true)
      return
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setAnimationData(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [url])

  return { animationData, loading, error }
}

/**
 * LottieAnimation - Wrapper component for Lottie animations
 */
function LottieAnimation({ url, className = '', loop = true, autoplay = true, style = {} }) {
  const { animationData, loading, error } = useLottieAnimation(url)

  if (loading || error || !animationData) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={style}>
        <div className="animate-pulse bg-slate-200 rounded-full w-full h-full" />
      </div>
    )
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
    />
  )
}

/**
 * LoadingSpinner - Simple spinning loader
 * @param {Object} props
 * @param {string} props.size - 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} props.color - Tailwind color class or hex
 * @param {string} props.className - Additional classes
 */
export function LoadingSpinner({ size = 'md', color = PRIMARY_COLOR, className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4'
  }

  return (
    <div
      className={`animate-spin rounded-full border-b-transparent ${sizeClasses[size]} ${className}`}
      style={{ borderColor: color, borderBottomColor: 'transparent' }}
      role="status"
      aria-label="Loading"
    />
  )
}

/**
 * LoadingPage - Full page loading state with Lottie animation
 * @param {Object} props
 * @param {string} props.message - Loading message
 * @param {string} props.submessage - Submessage
 * @param {string} props.lottieUrl - Custom Lottie URL (optional)
 */
export function LoadingPage({ message = 'Memuat...', submessage = '', lottieUrl = LOTTIE_URLS.loading }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      {/* Lottie Animation */}
      <div className="w-48 h-48 mb-4">
        <LottieAnimation url={lottieUrl} className="w-full h-full" />
      </div>
      
      <p className="text-lg font-medium text-slate-700">{message}</p>
      {submessage && <p className="text-sm text-slate-500 mt-1">{submessage}</p>}
    </div>
  )
}

/**
 * LoadingCard - Card skeleton loader
 * @param {Object} props
 * @param {number} props.count - Number of skeleton cards
 * @param {string} props.variant - 'card' | 'list' | 'table'
 */
export function LoadingCard({ count = 3, variant = 'card' }) {
  const skeletons = Array(count).fill(0)

  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {skeletons.map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/4" />
        </div>
        {skeletons.map((_, i) => (
          <div key={i} className="p-4 border-b border-slate-100 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-slate-200 rounded-full" />
              <div className="flex-1 flex gap-4">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-1/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {skeletons.map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-slate-200 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-5/6" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-8 bg-slate-200 rounded-lg w-20" />
            <div className="h-8 bg-slate-200 rounded-lg w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * EmptyState - No data available with Lottie animation
 * @param {Object} props
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {string} props.lottieUrl - Custom Lottie URL (optional)
 * @param {React.ReactNode} props.action - Action button element
 */
export function EmptyState({ 
  title = 'Tidak ada data', 
  description = 'Belum ada data yang tersedia',
  lottieUrl = LOTTIE_URLS.empty,
  action = null
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Lottie Animation */}
      <div className="w-48 h-48 mb-4">
        <LottieAnimation url={lottieUrl} className="w-full h-full" />
      </div>
      
      <h3 className="text-xl font-semibold text-slate-700 mb-2 text-center">{title}</h3>
      <p className="text-slate-500 text-center max-w-sm mb-6">{description}</p>
      
      {action && <div>{action}</div>}
    </div>
  )
}

/**
 * NotFound - 404 page not found with Lottie animation
 * @param {Object} props
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {string} props.backTo - Navigation path
 * @param {string} props.backLabel - Back button label
 * @param {string} props.lottieUrl - Custom Lottie URL (optional)
 */
export function NotFound({ 
  title = 'Halaman Tidak Ditemukan',
  description = 'Maaf, halaman yang Anda cari tidak ada atau sudah dipindahkan.',
  backTo = '/',
  backLabel = 'Kembali ke Beranda',
  lottieUrl = LOTTIE_URLS.notFound
}) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      {/* Lottie Animation */}
      <div className="w-64 h-64 mb-4">
        <LottieAnimation url={lottieUrl} className="w-full h-full" />
      </div>
      
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 text-center">{title}</h1>
      <p className="text-slate-500 text-center max-w-md mb-8">{description}</p>
      
      <button
        onClick={() => navigate(backTo)}
        className="px-6 py-3 bg-[#1E258F] text-white font-medium rounded-xl hover:bg-[#1E258F]/90 transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {backLabel}
      </button>
    </div>
  )
}

/**
 * ErrorState - Error occurred with Lottie animation
 * @param {Object} props
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {function} props.onRetry - Retry callback
 * @param {string} props.retryLabel - Retry button label
 * @param {string} props.lottieUrl - Custom Lottie URL (optional)
 */
export function ErrorState({ 
  title = 'Terjadi Kesalahan',
  description = 'Maaf, terjadi kesalahan saat memuat data. Silakan coba lagi.',
  onRetry = null,
  retryLabel = 'Coba Lagi',
  lottieUrl = LOTTIE_URLS.error
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Lottie Animation */}
      <div className="w-48 h-48 mb-4">
        <LottieAnimation url={lottieUrl} className="w-full h-full" />
      </div>
      
      <h3 className="text-xl font-semibold text-slate-700 mb-2 text-center">{title}</h3>
      <p className="text-slate-500 text-center max-w-sm mb-6">{description}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {retryLabel}
        </button>
      )}
    </div>
  )
}

/**
 * SuccessState - Success confirmation with Lottie animation
 * @param {Object} props
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {React.ReactNode} props.action - Action button element
 * @param {string} props.lottieUrl - Custom Lottie URL (optional)
 */
export function SuccessState({ 
  title = 'Berhasil!',
  description = 'Operasi berhasil dilakukan.',
  action = null,
  lottieUrl = LOTTIE_URLS.success
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Lottie Animation */}
      <div className="w-48 h-48 mb-4">
        <LottieAnimation url={lottieUrl} className="w-full h-full" loop={false} />
      </div>
      
      <h3 className="text-xl font-semibold text-slate-700 mb-2 text-center">{title}</h3>
      <p className="text-slate-500 text-center max-w-sm mb-6">{description}</p>
      
      {action && <div>{action}</div>}
    </div>
  )
}

/**
 * ComingSoon - Feature not yet available with Lottie animation
 * @param {Object} props
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {function} props.onBack - Back callback
 * @param {string} props.lottieUrl - Custom Lottie URL (optional)
 */
export function ComingSoon({ 
  title = 'Segera Hadir',
  description = 'Fitur ini sedang dalam pengembangan dan akan segera tersedia.',
  onBack = null,
  lottieUrl = LOTTIE_URLS.comingSoon
}) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Lottie Animation - Using DotLottieReact for .lottie files */}
      <div className="w-48 h-48 mb-4">
        <DotLottieReact
          src={lottieUrl}
          loop
          autoplay
        />
      </div>
      
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        Dalam Pengembangan
      </div>
      
      <h3 className="text-xl font-semibold text-slate-700 mb-2 text-center">{title}</h3>
      <p className="text-slate-500 text-center max-w-sm mb-6">{description}</p>
      
      {onBack && (
        <button
          onClick={onBack || (() => navigate(-1))}
          className="px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali
        </button>
      )}
    </div>
  )
}

/**
 * NoConnection - Network error with Lottie animation
 * @param {Object} props
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {function} props.onRetry - Retry callback
 * @param {string} props.lottieUrl - Custom Lottie URL (optional)
 */
export function NoConnection({ 
  title = 'Tidak Ada Koneksi',
  description = 'Periksa koneksi internet Anda dan coba lagi.',
  onRetry = null,
  lottieUrl = LOTTIE_URLS.noConnection
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Lottie Animation */}
      <div className="w-48 h-48 mb-4">
        <LottieAnimation url={lottieUrl} className="w-full h-full" />
      </div>
      
      <h3 className="text-xl font-semibold text-slate-700 mb-2 text-center">{title}</h3>
      <p className="text-slate-500 text-center max-w-sm mb-6">{description}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-[#1E258F] text-white font-medium rounded-xl hover:bg-[#1E258F]/90 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Coba Lagi
        </button>
      )}
    </div>
  )
}

/**
 * Maintenance - Under maintenance with Lottie animation
 * @param {Object} props
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {string} props.lottieUrl - Custom Lottie URL (optional)
 */
export function Maintenance({ 
  title = 'Sedang Maintenance',
  description = 'Kami sedang melakukan pemeliharaan sistem. Silakan kembali beberapa saat lagi.',
  lottieUrl = LOTTIE_URLS.maintenance
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      {/* Lottie Animation */}
      <div className="w-64 h-64 mb-4">
        <LottieAnimation url={lottieUrl} className="w-full h-full" />
      </div>
      
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1E258F]/10 text-[#1E258F] rounded-full text-sm font-medium mb-4">
        <span className="w-2 h-2 bg-[#1E258F] rounded-full animate-pulse" />
        Maintenance Mode
      </div>
      
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 text-center">{title}</h1>
      <p className="text-slate-500 text-center max-w-md">{description}</p>
    </div>
  )
}

/**
 * InlineLoading - Inline loading indicator for buttons/text
 * @param {Object} props
 * @param {string} props.text - Loading text
 */
export function InlineLoading({ text = 'Memproses...' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LoadingSpinner size="sm" />
      <span>{text}</span>
    </span>
  )
}

/**
 * Default export with all components
 */
export default {
  LoadingSpinner,
  LoadingPage,
  LoadingCard,
  EmptyState,
  NotFound,
  ErrorState,
  SuccessState,
  ComingSoon,
  NoConnection,
  Maintenance,
  InlineLoading
}
