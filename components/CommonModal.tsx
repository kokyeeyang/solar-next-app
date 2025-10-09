'use client'

import { useEffect, useState } from 'react'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function CommonModal({ isOpen, onClose, children }: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 300); // Match the duration of your fade-out animation
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-8">
      {/* <div className="bg-white rounded-lg shadow-lg w-full relative"> */}
      <div className={`bg-white rounded-lg shadow-lg w-full relative transform transition-all duration-300 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          CLOSE
        </button>
        {children}
      </div>
    </div>
  )
}
