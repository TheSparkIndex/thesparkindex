"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-2xl font-black tracking-tight text-key-ink sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-key-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-key-border bg-key-white p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  hint,
  placeholder,
  onChangeValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  onChangeValue?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-key-ink">
        {label}
        {required ? <span className="text-key-orange"> *</span> : null}
      </span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        onChange={onChangeValue ? (e) => onChangeValue(e.target.value) : undefined}
        className="h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none transition-colors focus:border-key-primary"
      />
      {hint ? <span className="mt-1 block text-xs text-key-muted">{hint}</span> : null}
    </label>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  value,
  onChangeValue,
  options,
  required,
  hint,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  value?: string;
  onChangeValue?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-key-ink">
        {label}
        {required ? <span className="text-key-orange"> *</span> : null}
      </span>
      <select
        name={name}
        value={value}
        defaultValue={value === undefined ? (defaultValue ?? "") : undefined}
        required={required}
        onChange={onChangeValue ? (e) => onChangeValue(e.target.value) : undefined}
        className={cn(
          "h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none transition-colors focus:border-key-primary",
          className
        )}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? <span className="mt-1 block text-xs text-key-muted">{hint}</span> : null}
    </label>
  );
}

export function Checkbox({
  label,
  name,
  defaultChecked,
  checked,
  onChange,
  hint,
  className,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={cn("flex items-center gap-2.5 text-sm font-bold text-key-ink", className)}>
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked === undefined ? defaultChecked : undefined}
        checked={checked}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        className="size-4 rounded border-key-border accent-key-primary"
      />
      <span>
        <span className="block">{label}</span>
        {hint ? <span className="block text-xs font-normal text-key-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

export function StatusBadge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={
        active
          ? "rounded-full bg-key-lime-soft px-2.5 py-1 text-xs font-black text-key-ink"
          : "rounded-full bg-key-ink-soft px-2.5 py-1 text-xs font-black text-key-muted"
      }
    >
      {children}
    </span>
  );
}

export function Textarea({
  label,
  name,
  defaultValue,
  rows = 4,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-key-ink">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        rows={rows}
        className="w-full rounded-lg border-2 border-key-border bg-key-surface px-3 py-2 text-sm outline-none transition-colors focus:border-key-primary"
      />
      {hint ? <span className="mt-1 block text-xs text-key-muted">{hint}</span> : null}
    </label>
  );
}

export function SubmitButton({ pending, children }: { pending?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-key-primary px-6 font-bold text-white transition-colors hover:bg-key-primary-dark disabled:opacity-60"
    >
      {pending ? "Guardando…" : children}
    </button>
  );
}

export function ErrorBox({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-key-orange/10 px-3 py-2.5 text-sm font-semibold text-key-orange">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

export function SuccessBox({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

export function ConfirmButton({
  onConfirm,
  children,
  className,
  title,
}: {
  onConfirm: () => Promise<{ error?: string } | void>;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iconMode = title != null;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirming) {
            setConfirming(true);
            timeoutRef.current = setTimeout(() => setConfirming(false), 3000);
            return;
          }
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setConfirming(false);
          startTransition(async () => {
            const result = await onConfirm();
            if (result && "error" in result && result.error) setError(result.error);
          });
        }}
        title={iconMode ? (confirming ? "¿Confirmar eliminación?" : title) : undefined}
        aria-label={iconMode ? (confirming ? "¿Confirmar eliminación?" : title) : undefined}
        className={cn(
          iconMode
            ? "grid size-7 place-items-center rounded-md disabled:opacity-50"
            : "rounded-md px-2 py-1 text-xs font-bold underline-offset-2",
          confirming ? "bg-key-orange text-key-white" : "text-key-muted hover:text-key-orange",
          className
        )}
      >
        {iconMode ? children : pending ? "Eliminando…" : confirming ? "¿Seguro?" : children}
      </button>
      {error ? (
        <span className={cn("text-xs text-key-orange", iconMode && "whitespace-nowrap")}>{error}</span>
      ) : null}
    </span>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-bold text-key-muted transition-colors hover:text-key-primary">
      ← {children}
    </Link>
  );
}
