import * as React from 'react'
import { createContext, useContext, useCallback } from 'react'
import { cn } from '@/lib/utils'

export interface ToasterProps {
  className?: string
}

export function Toaster({ className }: ToasterProps) {
  return (
    <div
      className={cn(
        'fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-auto sm:top-auto sm:flex-col md:max-w-[420px]',
        className
      )}
    />
  )
}

// Toast上下文和Hook
type ToastProps = {
  id?: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

type ToastActionElement = React.ReactElement

const ToastContext = createContext<{
  toast: (props: ToastProps) => void
  dismiss: (id: string) => void
}>({
  toast: () => {},
  dismiss: () => {},
})

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([])

  const toast = React.useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...props, id }

    setToasts(prev => [...prev, newToast])

    if (props.duration !== 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, props.duration || 5000)
    }
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <Toaster />
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </ToastContext.Provider>
  )
}

function Toast({ title, description, variant = 'default' }: ToastProps) {
  return (
    <div
      className={cn(
        'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
        variant === 'destructive'
          ? 'destructive group border-destructive bg-destructive text-destructive-foreground'
          : 'border bg-background text-foreground'
      )}
    >
      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
      </div>
    </div>
  )
}