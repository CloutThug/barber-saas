'use client'

interface CancelSubscriptionButtonProps {
  subscriptionId: string
  customerName: string
  onCancel: (formData: FormData) => void
}

export function CancelSubscriptionButton({ subscriptionId, customerName, onCancel }: CancelSubscriptionButtonProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(`Cancelar a assinatura de "${customerName}"?`)) {
      e.preventDefault()
    }
  }

  return (
    <form action={onCancel} onSubmit={handleSubmit} className="inline">
      <input type="hidden" name="subscription_id" value={subscriptionId} />
      <button
        type="submit"
        className="text-destructive hover:text-destructive/80 font-medium hover:underline text-xs"
      >
        Cancelar
      </button>
    </form>
  )
}
