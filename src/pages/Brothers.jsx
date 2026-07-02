import { useState, useEffect } from 'react'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import Modal from '../components/ui/Modal'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

export default function Brothers() {
  const store = useAppStore()
  const { brothers, loading, error } = store
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | { mode: 'create' | 'edit', data?: brother }

  useEffect(() => {
    if (!brothers.length) store.fetchBrothers()
  }, [])

  const filtered = brothers.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setModal({ mode: 'create' })
  }

  function openEdit(brother) {
    setModal({ mode: 'edit', data: brother })
  }

  function closeModal() {
    setModal(null)
  }

  async function handleSubmit(data) {
    if (modal.mode === 'create') {
      await store.createBrother(data)
    } else {
      await store.updateBrother(modal.data.id, data)
    }
    closeModal()
  }

  async function handleDelete(brother) {
    if (window.confirm(`Excluir "${brother.name}"? Esta ação não pode ser desfeita.`)) {
      await store.deleteBrother(brother.id)
    }
  }

  if (loading) return <div className="p-8 text-ink/60">Carregando...</div>

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-surface-border bg-surface-card">
        <h1 className="text-xl font-semibold text-ink">Irmãos</h1>
        <Button variant="primary" onClick={openCreate}>
          <Plus size={16} />
          Novo Irmão
        </Button>
      </div>

      <div className="px-4 md:px-8 py-4 bg-surface-card border-b border-surface-border">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Filtrar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-surface-border rounded-lg pl-9 pr-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
      </div>

      {error && (
        <div className="mx-4 md:mx-8 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto px-4 md:px-8 py-6">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-subtle border-b border-surface-border">
                <th className="text-left px-4 py-3 font-medium text-ink/70">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-ink/70">Telefone</th>
                <th className="text-left px-4 py-3 font-medium text-ink/70 hidden md:table-cell">Anotações</th>
                <th className="text-left px-4 py-3 font-medium text-ink/70">Status</th>
                <th className="text-left px-4 py-3 font-medium text-ink/70">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink/40">
                    Nenhum irmão encontrado.
                  </td>
                </tr>
              )}
              {filtered.map((brother) => (
                <tr
                  key={brother.id}
                  className={`border-b border-surface-border hover:bg-surface-subtle transition-colors ${
                    !brother.active ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-ink">{brother.name}</td>
                  <td className="px-4 py-3 text-ink/70">{brother.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-ink/70 max-w-xs truncate hidden md:table-cell">
                    {brother.notes ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge active={brother.active === true} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(brother)}
                        title="Editar"
                        className="p-1.5 rounded-md text-ink/50 hover:text-ink hover:bg-surface-subtle transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(brother)}
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
          title={modal.mode === 'create' ? 'Novo Irmão' : 'Editar Irmão'}
          onClose={closeModal}
        >
          <BrotherForm
            initial={modal.data}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </div>
  )
}

function BrotherForm({ initial, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    onSubmit({
      name: name.trim(),
      phone: phone.trim() || null,
      notes: notes.trim() || null,
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
          placeholder="Nome do irmão"
          className="border border-surface-border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Telefone</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(00) 00000-0000"
          className="border border-surface-border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Anotações</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações opcionais..."
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
