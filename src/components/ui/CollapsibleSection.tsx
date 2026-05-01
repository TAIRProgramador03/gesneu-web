import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import React, { useState } from 'react'

export const CollapsibleSection = ({
  title,
  icon,
  defaultOpen = true,
  headerRight,
  children,
  border = "border-grey-500",
  bgHeader = "bg-white"
}: {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  headerRight?: React.ReactNode
  children: React.ReactNode
  border?: string
  bgHeader?: string
}) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn("rounded-2xl bg-white shadow-sm border-t-4", border)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between p-5 transition-colors rounded-tl-xl rounded-tr-xl bg-linear-to-r",
          bgHeader,
          open ? "hover:bg-gray-50/50" : "hover:bg-gray-50/50 rounded-2xl"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-sky-50 text-sky-700 p-2">
            {icon}
          </div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {headerRight}
          <ChevronDown
            className={cn(
              "size-5 text-gray-400 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          {children}
        </div>
      )}
    </div>
  )
}
