'use client'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastProvider,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="min-w-0 flex-1 pr-2">
              <div className="overflow-hidden text-sm leading-5 text-red-400 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                {title ? (
                  <span className="font-semibold text-red-300">
                    {title}
                  </span>
                ) : null}
                {title && description ? (
                  <span className="mx-1 text-red-300/70">-</span>
                ) : null}
                {description ? (
                  <span className="text-red-400/95">{description}</span>
                ) : null}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
