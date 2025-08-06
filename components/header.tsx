"use client"
import { Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">
      {/* Left side - Title */}
      <div className="flex items-center space-x-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Judson, serif" }}>
          Budget Control
        </h1>

        {/* Media Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-normal">
              Media
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem>All Media</DropdownMenuItem>
            <DropdownMenuItem>Digital</DropdownMenuItem>
            <DropdownMenuItem>Print</DropdownMenuItem>
            <DropdownMenuItem>Radio</DropdownMenuItem>
            <DropdownMenuItem>TV</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search campaign"
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Right side - Additional actions */}
      <div className="flex items-center space-x-3">
        <Button variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
          Exportar Datos
        </Button>
      </div>
    </header>
  )
}
