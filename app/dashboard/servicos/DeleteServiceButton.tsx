'use client'

interface DeleteServiceButtonProps {
  serviceId: string
  serviceName: string
  onDelete: (formData: FormData) => void
}

export function DeleteServiceButton({ serviceId, serviceName, onDelete }: DeleteServiceButtonProps) {
  const handleDelete = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(`Tem certeza que deseja deletar o serviço "${serviceName}"?`)) {
      e.preventDefault()
      return
    }
  }

  return (
    <form action={onDelete} onSubmit={handleDelete} className="inline">
      <input type="hidden" name="service_id" value={serviceId} />
      <button
        type="submit"
        className="text-destructive hover:text-destructive/80 font-medium hover:underline"
      >
        Deletar
      </button>
    </form>
  )
}
