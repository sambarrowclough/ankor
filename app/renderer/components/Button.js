import React, { forwardRef } from 'react'

export const Button = forwardRef(
  ({ onClick, text, shortcut, prefix, children }, ref) => (
    <button
      ref={ref}
      className="flex items-center text-gray-500 text-xs flex rounded-lg border-2 border-gray-100 px-1.5 py-1 focus:outline-none"
      onClick={onClick}
    >
      {prefix && (
        <span className="w-3.5 h-3.5 text-gray-500 stroke-current fill-current">
          {prefix}
        </span>
      )}
      <span
        style={{ maxWidth: '75px' }}
        className="mx-1.5 overflow-hidden whitespace-nowrap overflow-ellipsis"
      >
        {text ?? children}
      </span>
      <span
        style={{ fontSize: '10px' }}
        className="bg-gray-100 rounded px-1.5 py-.5 text-gray-500"
      >
        {shortcut}
      </span>
    </button>
  )
)
