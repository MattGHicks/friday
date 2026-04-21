"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Settings, User, Palette, MessageSquare, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { updateSettings, uploadLogo, removeLogo } from "./actions";

type UserData = {
  name: string | null;
  email: string;
  brandColor: string;
  logoUrl: string | null;
  welcomeMessage: string | null;
  plan: string;
  createdAt: Date;
};

const initialState: { error?: string; success?: boolean } = {};

export function SettingsClient({ user }: { user: UserData }) {
  const [state, formAction, isPending] = useActionState(updateSettings, initialState);
  const [logoUrl, setLogoUrl] = useState(user.logoUrl);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isLogoPending, startLogoTransition] = useTransition();
  const logoInputRef = useRef<HTMLInputElement>(null);

  function onLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    const formData = new FormData();
    formData.append("logo", file);
    startLogoTransition(async () => {
      const result = await uploadLogo(formData);
      if (result.error) setLogoError(result.error);
      else if (result.logoUrl) setLogoUrl(result.logoUrl);
      if (logoInputRef.current) logoInputRef.current.value = "";
    });
  }

  function onLogoRemove() {
    setLogoError(null);
    startLogoTransition(async () => {
      const result = await removeLogo();
      if (result.error) setLogoError(result.error);
      else setLogoUrl(null);
    });
  }

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
              <Label className="text-xs">Logo</Label>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/40 bg-surface-1">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Upload
                      className="h-4 w-4 text-muted-foreground/50"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={onLogoFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLogoPending}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {isLogoPending ? "Uploading…" : logoUrl ? "Replace" : "Upload"}
                  </Button>
                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isLogoPending}
                      onClick={onLogoRemove}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              {logoError ? (
                <p className="text-xs text-coral">{logoError}</p>
              ) : (
                <p className="text-xs text-muted-foreground/60">
                  PNG, JPG, SVG, or WEBP. Under 512 KB. Shown in your
                  client portal and quote emails.
                </p>
              )}
            </div>

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
