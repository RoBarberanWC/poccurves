"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface MultiSelectOption {
  label: string
  value: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = "Select items...",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (optionValue: string) => {
    if (disabled) return

    if (value.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const handleRemove = (optionValue: string) => {
    if (disabled) return
    onChange(value.filter((item) => item !== optionValue))
  }

  const selectedLabels = value.map((val) => {
    const option = options.find((opt) => opt.value === val)
    return option ? option.label : val
  })

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between min-h-10 h-auto bg-transparent",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {value.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selectedLabels.map((label, index) => (
                  <Badge
                    key={value[index]}
                    variant="secondary"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(value[index])
                    }}
                  >
                    {label}
                    <X className="ml-1 h-3 w-3 cursor-pointer" />
                  </Badge>
                ))
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full p-0">
          <div className="max-h-60 overflow-auto">
            {options.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">No options available</div>
            ) : (
              options.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <Check className={cn("mr-2 h-4 w-4", value.includes(option.value) ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </DropdownMenuItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
