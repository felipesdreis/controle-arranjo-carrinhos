import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import Modal from '../components/ui/Modal'

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

  if (loading) return <div className="p-8 text-slate-500">Carregando...</div>

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-slate-800">Carrinhos</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Novo Carrinho
        </button>
      </div>

      {error && (
        <div className="mx-8 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Descrição</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Nenhum carrinho cadastrado.
                  </td>
                </tr>
              )}
              {carts.map((cart) => (
                <tr
                  key={cart.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !cart.active ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{cart.name}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                    {cart.description ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {cart.active === true ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(cart)}
                        title="Editar"
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
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
        <label className="block text-sm font-medium text-slate-700 mb-1">
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
          className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição opcional..."
          rows={3}
          className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 text-slate-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
