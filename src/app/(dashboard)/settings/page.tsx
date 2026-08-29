"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/auth";
import { useAppStore } from "@/stores/app-store";
import { TerritoryService } from "@/services";
import {
  Sun,
  Moon,
  Monitor,
  User,
  Save,
  Palette,
  Settings as SettingsIcon,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appearance");

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [systemProvince, setSystemProvince] = useState("");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [systemSaved, setSystemSaved] = useState(false);

  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setProfilePhone(user.phone);
    }
  }, [user]);

  function loadData() {
    try {
      const provs = TerritoryService.getProvinces();
      setProvinces(provs);
    } finally {
      setLoading(false);
    }
  }

  function handleSaveProfile() {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  function handleSaveSystem() {
    setSystemSaved(true);
    setTimeout(() => setSystemSaved(false), 2000);
  }

  function getUserInitials() {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  if (loading) {
    return <LoadingState fullPage message="Loading settings..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="System configuration and preferences"
      />

      <Tabs defaultValue="appearance" onValueChange={setActiveTab}>
        <TabList>
          <Tab value="appearance">
            <Palette className="mr-2 h-4 w-4 inline" />
            Appearance
          </Tab>
          <Tab value="profile">
            <User className="mr-2 h-4 w-4 inline" />
            Profile
          </Tab>
          <Tab value="system">
            <SettingsIcon className="mr-2 h-4 w-4 inline" />
            System
          </Tab>
        </TabList>

        {/* Appearance Tab */}
        <TabPanel value="appearance">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Theme Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                  Choose your preferred theme for the application interface.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Light Mode */}
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`group relative rounded-xl border-2 p-1 transition-all ${
                      theme === "light"
                        ? "border-[#FF6B00] shadow-md"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
                  >
                    {theme === "light" && (
                      <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6B00]">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
                      <div className="mb-3 flex items-center gap-2">
                        <Sun className="h-5 w-5 text-amber-500" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          Light Mode
                        </span>
                      </div>
                      <div className="space-y-2 rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                        <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-600" />
                        <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-600" />
                        <div className="mt-2 flex gap-2">
                          <div className="h-6 w-16 rounded bg-[#FF6B00]" />
                          <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1">
                          <div className="h-8 rounded bg-white shadow-sm dark:bg-gray-500" />
                          <div className="h-8 rounded bg-white shadow-sm dark:bg-gray-500" />
                          <div className="h-8 rounded bg-white shadow-sm dark:bg-gray-500" />
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 pb-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      Light Mode
                    </p>
                  </button>

                  {/* Dark Mode */}
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`group relative rounded-xl border-2 p-1 transition-all ${
                      theme === "dark"
                        ? "border-[#FF6B00] shadow-md"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
                  >
                    {theme === "dark" && (
                      <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6B00]">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className="rounded-lg bg-gray-900 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Moon className="h-5 w-5 text-blue-400" />
                        <span className="font-medium text-gray-100">
                          Dark Mode
                        </span>
                      </div>
                      <div className="space-y-2 rounded-md bg-gray-800 p-3">
                        <div className="h-3 w-3/4 rounded bg-gray-700" />
                        <div className="h-3 w-1/2 rounded bg-gray-700" />
                        <div className="mt-2 flex gap-2">
                          <div className="h-6 w-16 rounded bg-[#FF6B00]" />
                          <div className="h-6 w-16 rounded bg-gray-700" />
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1">
                          <div className="h-8 rounded bg-gray-700" />
                          <div className="h-8 rounded bg-gray-700" />
                          <div className="h-8 rounded bg-gray-700" />
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 pb-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dark Mode
                    </p>
                  </button>

                  {/* System */}
                  <button
                    type="button"
                    onClick={() => {
                      const prefersDark = window.matchMedia(
                        "(prefers-color-scheme: dark)"
                      ).matches;
                      setTheme(prefersDark ? "dark" : "light");
                    }}
                    className={`group relative rounded-xl border-2 p-1 transition-all ${
                      false
                        ? "border-[#FF6B00] shadow-md"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="rounded-lg bg-gradient-to-br from-white to-gray-900 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-700">
                          System
                        </span>
                      </div>
                      <div className="space-y-2 rounded-md bg-gradient-to-br from-gray-50 to-gray-800 p-3">
                        <div className="h-3 w-3/4 rounded bg-gray-300 dark:bg-gray-600" />
                        <div className="h-3 w-1/2 rounded bg-gray-300 dark:bg-gray-600" />
                        <div className="mt-2 flex gap-2">
                          <div className="h-6 w-16 rounded bg-[#FF6B00]" />
                          <div className="h-6 w-16 rounded bg-gray-300 dark:bg-gray-600" />
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1">
                          <div className="h-8 rounded bg-white dark:bg-gray-700" />
                          <div className="h-8 rounded bg-white dark:bg-gray-700" />
                          <div className="h-8 rounded bg-white dark:bg-gray-700" />
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 pb-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      System Default
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        {/* Profile Tab */}
        <TabPanel value="profile">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-8 sm:flex-row">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FFF3EB] text-3xl font-bold text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                      {getUserInitials()}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Profile Photo
                    </p>
                  </div>

                  {/* Form */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <Input
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                        />
                      </div>
                      <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                        <Input
                          type="email"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                        <Input
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                        />
                      </div>
                      <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
                        <Input
                          value={user?.employeeId || ""}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <Input
                          value={user?.roleId || ""}
                          disabled
                        />
                      </div>
                      <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Login</label>
                        <Input
                          value={
                            user?.lastLogin
                              ? new Date(user.lastLogin).toLocaleString()
                              : "Never"
                          }
                          disabled
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button onClick={handleSaveProfile}>
                        <Save className="mr-2 h-4 w-4" />
                        {profileSaved ? "Saved!" : "Save Changes"}
                      </Button>
                      {profileSaved && (
                        <span className="text-sm text-[#FF6B00]">
                          Profile updated successfully
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        {/* System Tab */}
        <TabPanel value="system">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                  System-level configuration settings. Some fields are read-only
                  in this prototype.
                </p>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      System Name
                    </label>
                    <input
                      type="text"
                      value="Persons with Disabilities MIS"
                      disabled
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Version
                    </label>
                    <input
                      type="text"
                      value="1.0.0-beta"
                      disabled
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    />
                  </div>

                  <Select
                    label="Default Province"
                    value={systemProvince}
                    onChange={(e) => setSystemProvince(e.target.value)}
                  >
                    <option value="">Select Province</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Date Format"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </Select>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Session Timeout
                    </label>
                    <input
                      type="text"
                      value="30 minutes"
                      disabled
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Environment
                    </label>
                    <input
                      type="text"
                      value="Development"
                      disabled
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <Button onClick={handleSaveSystem}>
                    <Save className="mr-2 h-4 w-4" />
                    {systemSaved ? "Saved!" : "Save Configuration"}
                  </Button>
                  {systemSaved && (
                    <span className="text-sm text-[#FF6B00]">
                      Configuration saved successfully
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
