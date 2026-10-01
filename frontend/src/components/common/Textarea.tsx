// frontend/src/components/common/Textarea.tsx
import React, { forwardRef } from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-300">
            {label}
            {props.required && <span className="text-rose-400 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full px-3.5 py-2.5 bg-slate-900 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-slate-800 focus:border-transparent focus:ring-indigo-500 hover:border-slate-700'
          } ${className}`}
          {...props}
        />

        {error ? (
          <p className="text-xs text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-400">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
