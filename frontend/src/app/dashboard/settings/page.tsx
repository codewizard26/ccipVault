"use client"

import { useState } from "react"
import { Bell, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-blue-900">Settings</h1>
        <p className="text-blue-700 mt-2">
          Configure your vault preferences and account settings
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Preferences */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm">
          <div className="px-6 py-4 border-b border-blue-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="w-4 h-4 rounded-full bg-blue-600 inline-block" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900">Preferences</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Dark Mode</p>
                <p className="text-sm text-blue-700">Switch between light and dark themes</p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={(checked) => {
                  setDarkMode(checked)
                  if (checked) {
                    document.documentElement.classList.add('dark')
                  } else {
                    document.documentElement.classList.remove('dark')
                  }
                }}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>
        </div>
        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm">
          <div className="px-6 py-4 border-b border-blue-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900">Notifications</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Email Notifications</p>
                <p className="text-sm text-blue-700">Receive updates about your vault activity</p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm">
          <div className="px-6 py-4 border-b border-blue-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900">Security</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Two-Factor Authentication</p>
                <p className="text-sm text-blue-700">Add an extra layer of security to your account</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
              >
                Enable
              </Button>
            </div>
            <Separator className="bg-blue-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Session Management</p>
                <p className="text-sm text-blue-700">View and manage active sessions</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
              >
                Manage
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
