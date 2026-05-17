"use client";

import { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";

export function formatPhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  const ten = digits.slice(0, 10);
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

type Props = Omit<React.ComponentProps<typeof Input>, "onChange" | "value" | "defaultValue" | "type"> & {
  defaultValue?: string;
};

export const PhoneInput = forwardRef<HTMLInputElement, Props>(function PhoneInput(
  { defaultValue, ...rest },
  ref,
) {
  const [value, setValue] = useState(() => formatPhone(defaultValue ?? ""));
  return (
    <Input
      ref={ref}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      value={value}
      onChange={(e) => setValue(formatPhone(e.target.value))}
      {...rest}
    />
  );
});
