import { Capacitor } from '@capacitor/core'

export async function getStatusBarHeight() {
  if (typeof window === 'undefined') return 0
  if (!Capacitor.isNativePlatform()) return 0
  try {
    const { StatusBar } = await import('@capacitor/status-bar')
    const info = await StatusBar.getInfo()
    return info.height || 0
  } catch {
    return 0
  }
}

export function isMobileDevice() {
  if (typeof window === 'undefined') return false

  // Tauri 桌面端：必定是桌面环境，直接返回 false
  // 避免带触摸屏的 Windows 笔记本在窄窗口时误判为移动端
  if (window.__TAURI_INTERNALS__ || window.__TAURI__) {
    return false
  }

  // Capacitor 原生 App（APK）：必定是移动端
  if (Capacitor.isNativePlatform()) {
    return true
  }

  const ua = navigator.userAgent || navigator.vendor || window.opera || ''
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i

  if (mobileRegex.test(ua)) {
    return true
  }

  if ('ontouchstart' in window && window.innerWidth < 1024) {
    return true
  }

  return false
}

export function isCapacitorApp() {
  return !!(window.Capacitor || window.webkit?.messageHandlers?.bridge)
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

export function isAndroid() {
  return /android/i.test(navigator.userAgent)
}

export function getAssetUrl(path) {
  if (!path) return path
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }
  const base = import.meta.env.BASE_URL || '/'
  if (path.startsWith('/')) {
    return base + path.slice(1)
  }
  return base + path
}
