'use client'

import { useState } from 'react'

interface Plan {
  id: string
  name: string
  price: number
}

interface CustomerTypeSelectorProps {
  plans: Plan[]
  defaultType: string
  defaultPlanId: string
}

export default function CustomerTypeSelector({
  plans,
  defaultType,
  defaultPlanId,
}: CustomerTypeSelectorProps) {
  const [customerType, setCustomerType] = useState(defaultType)

  return (
    <div className="space-y-4">
      {/* Tipo de Cliente */}
      <div>
        <label
          htmlFor="customer_type"
          className="block text-sm font-medium text-gray-700"
        >
          Tipo de Cliente
        </label>
        <select
          id="customer_type"
          name="customer_type"
          value={customerType}
          onChange={(e) => setCustomerType(e.target.value)}
          className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
        >
          <option value="avulso">Avulso</option>
          <option value="mensalista">Mensalista</option>
        </select>
      </div>

      {/* Seletor de Plano (visível apenas se mensalista) */}
      {customerType === 'mensalista' && (
        <div>
          <label
            htmlFor="plan_id"
            className="block text-sm font-medium text-gray-700"
          >
            Plano Mensal <span className="text-red-500">*</span>
          </label>
          {plans.length > 0 ? (
            <select
              id="plan_id"
              name="plan_id"
              required
              defaultValue={defaultPlanId}
              className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            >
              <option value="">Selecione um plano</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — R$ {plan.price.toFixed(2)}/mês
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-sm text-amber-600">
              Nenhum plano cadastrado. Cadastre um plano mensal antes de
              definir o cliente como mensalista.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
