'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button, Textarea } from './ui'

export function AdminNote({ orderId, initialNote }) {
  const router = useRouter()
  const [note, setNote] = useState(initialNote ?? '')
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setPending(true)
    setSaved(false)

    const res = await fetch(`/api/admin/buyurtmalar/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNote: note }),
    })

    setPending(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const dirty = note !== (initialNote ?? '')

  return (
    <div>
      <label
        htmlFor="admin-note"
        className="mb-2 block text-sm font-medium text-card-foreground"
      >
        Admin izohi
      </label>
      <Textarea
        id="admin-note"
        rows={4}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ichki eslatma — mijoz ko'rmaydi."
      />
      <div className="mt-3 flex items-center gap-3">
        <Button onClick={save} pending={pending} disabled={!dirty}>
          Saqlash
        </Button>
        {saved ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-success-deep">
            <Check className="size-4" aria-hidden="true" />
            Saqlandi
          </span>
        ) : null}
      </div>
    </div>
  )
}
