'use client'

import { useState, useCallback } from 'react'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function stripPhone(value: string): string {
  return value.replace(/\D/g, '')
}

interface PhoneInputProps {
  name: string
  id?: string
  defaultValue?: string | null
  placeholder?: string
  className?: string
}

export default function PhoneInput({
  name,
  id,
  defaultValue,
  placeholder = '(00) 00000-0000',
  className = '',
}: PhoneInputProps) {
  const [display, setDisplay] = useState(() =>
    formatPhone(defaultValue ?? '')
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDisplay(formatPhone(e.target.value))
    },
    []
  )

  return (
    <>
      <input
        type="tel"
        id={id}
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        autoComplete="tel"
      />
      {/* Hidden input sends only digits to the server action */}
      <input type="hidden" name={name} value={stripPhone(display)} />
    </>
  )
}
