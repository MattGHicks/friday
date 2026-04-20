"use client";

import { useActionState } from "react";
import { format } from "date-fns";
import { Settings, User, Palette, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { updateSettings } from "./actions";

type UserData = {
  name: string | null;
  email: string;
  brandColor: string;
  welcomeMessage: string | null;
  plan: string;
  createdAt: Date;
};

const initialState: { error?: string; success?: boolean } = {};

export function SettingsClient({ user }: { user: UserData }) {
  const [state, formAction, isPending] = useActionState(updateSettings, initialState);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, brand, and payment connections. Pipeline
          stages now live on the{" "}
          <a
            href="/pipeline"
            className="text-fire hover:text-gold transition-colors"
          >
            Pipeline
          </a>{" "}
          page.
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        {/* Profile */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <h2 className="font-heading text-sm font-semibold">Profile</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Display name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name ?? ""}
                placeholder="Your name"
                className="max-w-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                value={user.email}
                disabled
                className="max-w-sm bg-muted/30 text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground/60">
                Email is managed through your authentication provider.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <h2 className="font-heading text-sm font-semibold">Portal branding</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="brandColor" className="text-xs">Brand color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="brandColorPicker"
                  type="color"
                  defaultValue={user.brandColor}
                  onChange={(e) => {
                    const input = document.getElementById("brandColor") as HTMLInputElement;
                    if (input) input.value = e.target.value;
                  }}
                  className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <Input
                  id="brandColor"
                  name="brandColor"
                  defaultValue={user.brandColor}
                  placeholder="#E8A838"
                  className="w-32 font-mono text-sm"
                  onChange={(e) => {
                    const picker = document.getElementById("brandColorPicker") as HTMLInputElement;
                    if (picker && /^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      picker.value = e.target.value;
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground/60">
                Used as the accent color in your client portal.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="welcomeMessage" className="text-xs">Welcome message</Label>
              <Textarea
                id="welcomeMessage"
                name="welcomeMessage"
                defaultValue={user.welcomeMessage ?? ""}
                placeholder="Add a personal note your clients will see when they visit their portal…"
                rows={3}
                className="max-w-lg resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground/60">
                Optional. Shown at the top of each client&apos;s portal page.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status messages + save */}
        {state.error && (
          <p className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="rounded-md bg-sage/10 px-3 py-2 text-sm text-sage">
            Settings saved.
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      {/* Account info */}
      <Card className="border-border/40 mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="font-heading text-sm font-semibold">Account</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium capitalize">{user.plan.toLowerCase()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium">{format(new Date(user.createdAt), "MMM d, yyyy")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
