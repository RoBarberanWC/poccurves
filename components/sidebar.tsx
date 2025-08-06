"use client"

import {
  BarChart3,
  DollarSign,
  Calendar,
  FileText,
  FlaskRoundIcon as Flask,
  Settings,
  Bell,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter, usePathname } from "next/navigation"

const menuItems = [
  { icon: BarChart3, id: "analytics", path: "/dashboard", active: false },
  { icon: TrendingUp, id: "pacing", path: "/", active: false }, // Changed to home route
  { icon: DollarSign, id: "budget", path: "/budget", active: false }, // Changed to different route
  { icon: Calendar, id: "calendar", path: "/calendar", active: false },
  { icon: FileText, id: "documents", path: "/documents", active: false },
  { icon: Flask, id: "experiments", path: "/experiments", active: false },
]

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div className="flex flex-col h-screen w-16 bg-black border-r border-gray-800 fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-800">
        <div className="w-8 h-8 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
            <path
              d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path d="M8 12l2 2 6-6" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      </div>

      {/* Separator */}
      <Separator className="bg-gray-800" />

      {/* Notification Badge */}
      <div className="flex items-center justify-center py-4">
        <div className="relative">
          <Button variant="ghost" size="icon" className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-lg">
            <Bell className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Separator */}
      <Separator className="bg-gray-800" />

      {/* Main Menu Items */}
      <div className="flex-1 flex flex-col items-center py-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="icon"
              onClick={() => handleNavigation(item.path)}
              className={`w-10 h-10 rounded-lg transition-colors ${
                isActive ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Icon className="w-5 h-5" />
            </Button>
          )
        })}
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center space-y-4 pb-4">
        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
        >
          <Settings className="w-5 h-5" />
        </Button>

        {/* Flag */}
        <div className="w-8 h-6 rounded-sm overflow-hidden">
          <div className="w-full h-full bg-gradient-to-b from-red-500 via-white to-blue-500 flex items-center justify-center">
            <div className="w-full h-1/3 bg-red-500"></div>
            <div className="w-full h-1/3 bg-white flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="w-full h-1/3 bg-blue-500"></div>
          </div>
        </div>

        {/* User Avatar */}
        <Avatar className="w-10 h-10">
          <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
          <AvatarFallback className="bg-gray-700 text-white text-sm">U</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
