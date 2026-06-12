import { useState, useRef } from 'react'
import { Download, Upload, CheckCircle, Trash2, AlertTriangle, Info } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import Modal from '../components/ui/Modal'

export default function Settings() {
  const { db, persist } = useAppStore()

  const [congregationName, setCongregationName] = useState(
    () => localStorage.getItem('congregationName') || ''
  )
  const [saved, setSaved] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearing, setClearing] = useState(false)
  const fileRef = useRef(null)

  function handleSave(e) {
    e.preventDefault()
    localStorage.setItem('congregationName', congregationName.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleExportDB() {
    if (!db) return
    const data = db.export()
    const blob = new Blob([data], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'carrinho.db'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handleImportDB(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportMsg(null)
    try {
      const data = new Uint8Array(await file.arrayBuffer())
      const opfsRoot = await navigator.storage.getDirectory()
      const fh = await opfsRoot.getFileHandle('carrinho.db', { create: true })
      const writable = await fh.createWritable()
      await writable.write(data)
      await writable.close()
      setImportMsg({ type: 'ok', text: 'Banco importado com sucesso. Recarregando...' })
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setImportMsg({ type: 'err', text: `Erro ao importar: ${err.message}` })
    }
    // Reset file input
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleClearAll() {
    if (!db) return
    setClearing(true)
    try {
      db.run('DELETE FROM assignments')
      db.run('DELETE FROM schedule_weeks')
      await persist()
      setShowClearModal(false)
      setClearing(false)
      window.location.reload()
    } catch (err) {
      setClearing(false)
      alert('Erro ao limpar dados: ' + err.message)
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Preferências</h1>
        <p className="text-slate-500 text-sm mt-1">Configurações gerais da aplicação</p>
      </div>

      {/* Seção: Congregação */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-700 mb-4">Dados da congregação</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nome da congregação
            </label>
            <input
              type="text"
              value={congregationName}
              onChange={(e) => setCongregationName(e.target.value)}
              placeholder="Ex: Congregação Centro"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <p className="text-xs text-slate-400 mt-1">
              Aparece no cabeçalho do relatório PDF.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Salvar
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-green-600 text-sm">
                <CheckCircle size={15} />
                Salvo!
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Seção: Banco de dados */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-700 mb-1">Banco de dados local</h2>
        <p className="text-sm text-slate-500 mb-5">
          O banco de dados fica armazenado no seu navegador (OPFS). Exporte para fazer backup
          ou importe para restaurar em outro dispositivo.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleExportDB}
            disabled={!db}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-slate-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 w-fit"
          >
            <Download size={15} />
            Exportar banco (.db)
          </button>

          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors text-sm font-medium w-fit"
            >
              <Upload size={15} />
              Importar banco (.db)
            </button>
            <p className="text-xs text-slate-400 mt-1 ml-1">
              Atenção: substitui todos os dados atuais.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".db"
              onChange={handleImportDB}
              className="hidden"
            />
          </div>

          {importMsg && (
            <div
              className={`text-sm px-3 py-2 rounded-lg border ${
                importMsg.type === 'ok'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {importMsg.text}
            </div>
          )}
        </div>
      </section>

      {/* Seção: Limpar dados */}
      <section className="bg-white rounded-xl border border-red-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-700 mb-1">Limpar dados de programação</h2>
        <p className="text-sm text-slate-500 mb-5">
          Remove todas as semanas de programação e designações. Carrinhos, irmãos e locais são mantidos.
        </p>
        <button
          onClick={() => setShowClearModal(true)}
          disabled={!db}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors text-sm font-medium w-fit disabled:opacity-50"
        >
          <Trash2 size={15} />
          Limpar programações
        </button>
      </section>

      {/* Seção: Sobre */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Info size={16} className="text-slate-400" />
          Sobre
        </h2>
        <div className="space-y-1 text-sm text-slate-600">
          <p><span className="font-medium">Versão:</span> 0.1.0</p>
          <p><span className="font-medium">Banco de dados:</span> SQLite via sql.js (WebAssembly)</p>
          <p><span className="font-medium">Armazenamento:</span> OPFS (Origin Private File System)</p>
        </div>
      </section>

      {showClearModal && (
        <Modal title="Confirmar limpeza" onClose={() => setShowClearModal(false)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Esta ação irá remover <strong>todas as semanas de programação e designações</strong>.
                Carrinhos, irmãos e locais serão mantidos. Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-slate-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {clearing ? 'Limpando...' : 'Confirmar limpeza'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
