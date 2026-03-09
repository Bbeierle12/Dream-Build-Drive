"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createBrowserClient } from "@supabase/ssr"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  User,
  Palette,
  Info,
  Mail,
  Lock,
  Wrench,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type SettingsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function useSupabaseUser() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
      setLoading(false)
    })
  }, [])

  return { email, loading }
}

function AccountTab() {
  const { email, loading } = useSupabaseUser()
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail) return
    setSubmitting(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Confirmation email sent to your new address")
        setNewEmail("")
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    setSubmitting(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Password updated")
        setNewPassword("")
        setConfirmPassword("")
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteAccount() {
    toast.error(
      "Contact support to delete your account. This cannot be undone."
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>Signed in as</span>
        </div>
        <p className="text-sm font-medium">
          {loading ? "Loading..." : email ?? "Unknown"}
        </p>
      </div>

      <Separator />

      <form onSubmit={handleUpdateEmail} className="space-y-3">
        <Label htmlFor="settings-new-email" className="text-sm font-medium">
          Change Email
        </Label>
        <div className="flex gap-2">
          <Input
            id="settings-new-email"
            type="email"
            placeholder="new@email.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={submitting || !newEmail}>
            Update
          </Button>
        </div>
      </form>

      <Separator />

      <form onSubmit={handleUpdatePassword} className="space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Change Password</Label>
        </div>
        <Input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={6}
        />
        <Button
          type="submit"
          size="sm"
          disabled={submitting || !newPassword || !confirmPassword}
        >
          Update Password
        </Button>
      </form>

      <Separator />

      <div className="space-y-2">
        <p className="text-sm font-medium text-destructive">Danger Zone</p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteAccount}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </div>
    </div>
  )
}

const THEME_OPTIONS: { value: string; label: string; desc: string; disabled?: boolean }[] = [
  { value: "dark", label: "Dark", desc: "Default dark automotive theme" },
  { value: "midnight", label: "Midnight", desc: "Deeper blacks, blue tint" },
  { value: "light", label: "Light", desc: "Coming soon", disabled: true },
]

const ACCENT_OPTIONS = [
  { value: "#C0392B", label: "Rally Red" },
  { value: "#E67E22", label: "Sunset Orange" },
  { value: "#2ECC71", label: "Racing Green" },
  { value: "#3498DB", label: "Blueprint Blue" },
  { value: "#9B59B6", label: "Midnight Purple" },
  { value: "#F1C40F", label: "Speed Yellow" },
] as const

function AppearanceTab() {
  const [theme, setTheme] = useState("dark")
  const [accent, setAccent] = useState("#C0392B")

  useEffect(() => {
    setTheme(localStorage.getItem("dbd-theme") ?? "dark")
    setAccent(localStorage.getItem("dbd-accent") ?? "#C0392B")
  }, [])

  function handleThemeChange(value: string) {
    setTheme(value)
    localStorage.setItem("dbd-theme", value)
    toast.success(`Theme set to ${value}`)
  }

  function handleAccentChange(value: string) {
    setAccent(value)
    localStorage.setItem("dbd-accent", value)
    document.documentElement.style.setProperty("--accent-color", value)
    toast.success("Accent color updated")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Theme</Label>
        <div className="grid gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => !opt.disabled && handleThemeChange(opt.value)}
              disabled={opt.disabled}
              className={cn(
                "flex items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition-colors",
                theme === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent hover:text-accent-foreground",
                opt.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div>
                <p className="font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              {theme === opt.value && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Accent Color</Label>
        <div className="grid grid-cols-3 gap-2">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAccentChange(opt.value)}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                accent === opt.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              )}
            >
              <div
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: opt.value }}
              />
              <span className="truncate text-xs">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function AboutTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Wrench className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-lg font-bold">Dream Build Drive</p>
          <p className="text-sm text-muted-foreground">v3.0.0</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Your car build command center. Track parts, manage tasks, log specs,
        and visualize your project from teardown to first start.
      </p>

      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Stack</span>
          <span>Next.js + Supabase</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Fonts</span>
          <span>DM Mono + Space Grotesk</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Charts</span>
          <span>Recharts</span>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Keyboard Shortcuts
        </p>
        <div className="grid gap-1.5 text-sm">
          {[
            { keys: "⌘ K", desc: "Search" },
            { keys: "⌘ N", desc: "New Build" },
            { keys: "⌘ ,", desc: "Settings" },
          ].map((s) => (
            <div key={s.keys} className="flex justify-between">
              <span className="text-muted-foreground">{s.desc}</span>
              <kbd className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] sm:max-h-[85vh] sm:overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account, appearance, and preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="account" className="flex-1 gap-1.5">
              <User className="h-3.5 w-3.5" />
              Account
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex-1 gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="about" className="flex-1 gap-1.5">
              <Info className="h-3.5 w-3.5" />
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="mt-4">
            <AccountTab />
          </TabsContent>
          <TabsContent value="appearance" className="mt-4">
            <AppearanceTab />
          </TabsContent>
          <TabsContent value="about" className="mt-4">
            <AboutTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
