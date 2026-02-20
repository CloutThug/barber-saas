'use client'

interface DeletePlanButtonProps {
  planId: string
  planName: string
  onDelete: (formData: FormData) => void
}

export function DeletePlanButton({ planId, planName, onDelete }: DeletePlanButtonProps) {
  const handleDelete = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(`Tem certeza que deseja deletar o plano "${planName}"?`)) {
      e.preventDefault()
      return
    }
  }

  return (
    <form action={onDelete} onSubmit={handleDelete} className="inline">
      <input type="hidden" name="plan_id" value={planId} />
      <button
        type="submit"
        className="text-red-600 hover:text-red-900 font-medium hover:underline"
      >
        Deletar
      </button>
    </form>
  )
}
