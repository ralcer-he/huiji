export function isMobileDevice() {
  if (typeof window === 'undefined') return false

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
