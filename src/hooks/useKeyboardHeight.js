import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let willShowListener, willHideListener, didShowListener, didHideListener
    let visualViewportHandler

    const handleShow = (info) => {
      const height = info?.keyboardHeight || 0
      if (height > 0) {
        setKeyboardHeight(height)
        setIsKeyboardVisible(true)
      }
    }

    const handleHide = () => {
      setKeyboardHeight(0)
      setIsKeyboardVisible(false)
    }

    Keyboard.addListener('keyboardWillShow', handleShow).then(h => { willShowListener = h })
    Keyboard.addListener('keyboardDidShow', handleShow).then(h => { didShowListener = h })
    Keyboard.addListener('keyboardWillHide', handleHide).then(h => { willHideListener = h })
    Keyboard.addListener('keyboardDidHide', handleHide).then(h => { didHideListener = h })

    if (window.visualViewport) {
      let initialHeight = window.visualViewport.height
      visualViewportHandler = () => {
        const vh = window.visualViewport.height
        const diff = initialHeight - vh
        if (diff > 100) {
          setKeyboardHeight(diff)
          setIsKeyboardVisible(true)
        } else if (diff < 50) {
          setKeyboardHeight(0)
          setIsKeyboardVisible(false)
        }
      }
      window.visualViewport.addEventListener('resize', visualViewportHandler)
      window.visualViewport.addEventListener('scroll', visualViewportHandler)
    }

    return () => {
      willShowListener?.remove()
      willHideListener?.remove()
      didShowListener?.remove()
      didHideListener?.remove()
      if (window.visualViewport && visualViewportHandler) {
        window.visualViewport.removeEventListener('resize', visualViewportHandler)
        window.visualViewport.removeEventListener('scroll', visualViewportHandler)
      }
    }
  }, [])

  return { keyboardHeight, isKeyboardVisible }
}
