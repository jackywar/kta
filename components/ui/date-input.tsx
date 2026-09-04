"use client";

import {
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes
} from "react";

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  /** Date ISO attendue par les API (`AAAA-MM-JJ`). */
  value: string;
  /** Retourne une date ISO valide, ou une chaîne vide. */
  onChange: (value: string) => void;
};

function isoToFrench(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function frenchToIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function formatDraft(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function DateInput({ value, onChange, ...props }: Props) {
  const [draft, setDraft] = useState(() => isoToFrench(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(isoToFrench(value));
  }, [value]);

  function setValidity(message: string) {
    inputRef.current?.setCustomValidity(message);
  }

  function handleChange(rawValue: string) {
    const nextDraft = formatDraft(rawValue);
    setDraft(nextDraft);
    setValidity("");

    if (!nextDraft) {
      onChange("");
      return;
    }

    if (nextDraft.length === 10) {
      const iso = frenchToIso(nextDraft);
      if (iso) {
        onChange(iso);
      } else {
        setValidity("Saisissez une date valide au format JJ/MM/AAAA.");
      }
    }
  }

  function handleBlur() {
    if (draft && !frenchToIso(draft)) {
      setValidity("Saisissez une date valide au format JJ/MM/AAAA.");
    }
  }

  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      inputMode="numeric"
      placeholder={props.placeholder ?? "JJ/MM/AAAA"}
      value={draft}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={handleBlur}
      pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
      maxLength={10}
    />
  );
}
