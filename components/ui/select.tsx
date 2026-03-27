"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";

type SelectProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>;
type SelectTriggerProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>;
type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;

export function Select(props: SelectProps) {
  return <SelectPrimitive.Root {...props} />;
}

export function SelectValue(props: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value {...props} />;
}

export function SelectTrigger({ className = "", children, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={`inline-flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <svg
          className="h-4 w-4 text-current opacity-70"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({ className = "", children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={`z-50 max-h-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg ${className}`}
        position="popper"
        sideOffset={6}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className = "", children, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={`relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm text-foreground outline-none data-[highlighted]:bg-muted ${className}`}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex h-4 w-4 items-center justify-center">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
