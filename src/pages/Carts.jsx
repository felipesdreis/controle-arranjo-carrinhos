import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import Modal from '../components/ui/Modal'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Carts() {
  const store = useAppStore()
  const { carts, loading, error } = store
  const [modal, setModal] = useState(null) // null | { mode: 'create' | 'edit', data?: cart }

  useEffect(() => {
    if (!carts.length) store.fetchCarts()
  }, [])

  function openCreate() {
    setModal({ mode: 'create' })
  }

  function openEdit(cart) {
    setModal({ mode: 'edit', data: cart })
  }

  function closeModal() {
    setModal(null)
  }

  async function handleSubmit(data) {
    if (modal.mode === 'create') {
      await store.createCart(data.name)
    } else {
      await store.updateCart(modal.data.id, data.name)
    }
    closeModal()
  }

  async function handleDelete(cart) {
    if (window.confirm(`Excluir "${cart.name}"? Esta ação não pode ser desfeita.`)) {
      await store.deleteCart(cart.id)
    }
  }

  if (loading) return <div className="p-8 text-ink/60">Carregando...</div>

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-surface-border bg-surface-card">
        <h1 className="text-xl font-semibold text-ink">Carrinhos</h1>
        <Button variant="primary" onClick={openCreate}>
          <Plus size={16} />
          Novo Carrinho
        </Button>
      </div>

      {error && (
        <div className="mx-4 md:mx-8 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto px-4 md:px-8 py-6">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-surface-subtle border-b border-surface-border">
                <th className="text-left px-4 py-3 font-medium text-ink/70">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-ink/70">Descrição</th>
                <th className="text-left px-4 py-3 font-medium text-ink/70">Status</th>
                <th className="text-left px-4 py-3 font-medium text-ink/70">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink/40">
                    Nenhum carrinho cadastrado.
                  </td>
                </tr>
              )}
              {carts.map((cart) => (
                <tr
                  key={cart.id}
                  className={`border-b border-surface-border hover:bg-surface-subtle transition-colors ${
                    !cart.active ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-ink">{cart.name}</td>
                  <td className="px-4 py-3 text-ink/70 max-w-xs truncate">
                    {cart.description ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {cart.active === true ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-green-soft text-accent-green">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-subtle text-ink/50">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(cart)}
                        title="Editar"
                        className="p-1.5 rounded-md text-ink/50 hover:text-ink hover:bg-surface-subtle transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(cart)}
                        title="Excluir"
                        className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      </div>

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'Novo Carrinho' : 'Editar Carrinho'}
          onClose={closeModal}
        >
          <CartForm
            initial={modal.data}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </div>
  )
}

function CartForm({ initial, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1">
          Nome <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          placeholder="Nome do carrinho"
          className="border border-surface-border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição opcional..."
          rows={3}
          className="border border-surface-border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" variant="primary">Salvar</Button>
        <Button type="button" variant="subtle" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}
