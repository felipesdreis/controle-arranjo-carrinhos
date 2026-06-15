import { useState, useEffect, useRef } from 'react'
import { Download, Upload, CheckCircle, Info } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { exportAllData, downloadJSON } from '../api/export'
import { importDataFromJSON } from '../api/import'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Settings() {
  const { congregationName, saveCongregationName } = useAppStore()
  const [localName, setLocalName] = useState(congregationName || '')
  const [saved, setSaved] = useState(false)
  const [exportMsg, setExportMsg] = useState(null)
  const [importMsg, setImportMsg] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef(null)

  // Sincronizar localName quando store carregar
  useEffect(() => { setLocalName(congregationName || '') }, [congregationName])

  async function handleSave(e) {
    e.preventDefault()
    await saveCongregationName(localName.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleExport() {
    setExporting(true)
    setExportMsg(null)
    try {
      const data = await exportAllData()
      downloadJSON(data, 'backup-carrinhos.json')
      setExportMsg({ type: 'ok', text: 'Exportação concluída com sucesso.' })
    } catch (err) {
      setExportMsg({ type: 'err', text: 'Erro ao exportar: ' + err.message })
    } finally {
      setExporting(false)
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportMsg(null)
    setImporting(true)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const result = await importDataFromJSON(json)
      setImportMsg({
        type: 'ok',
        text: `Importação concluída! ${Object.entries(result.counts).map(([k, v]) => `${v} ${k}`).join(', ')}`,
      })
    } catch (err) {
      setImportMsg({ type: 'err', text: 'Erro ao importar: ' + err.message })
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Preferências</h1>
        <p className="text-ink/60 text-sm mt-1">Configurações gerais da aplicação</p>
      </div>

      {/* Seção: Congregação */}
      <Card className="p-6 mb-4">
        <h2 className="font-semibold text-ink mb-4">Dados da congregação</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Nome da congregação
            </label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Ex: Congregação Centro"
              className="border border-surface-border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
            <p className="text-xs text-ink/40 mt-1">
              Aparece no cabeçalho do relatório PDF.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary">Salvar</Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-accent-green text-sm">
                <CheckCircle size={15} />
                Salvo!
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* Seção: Backup de dados */}
      <Card className="p-6 mb-4">
        <h2 className="font-semibold text-ink mb-1">Backup de dados</h2>
        <p className="text-sm text-ink/60 mb-5">
          Exporte todos os seus dados em formato JSON para fazer backup ou transferir para outro
          dispositivo. Importe um backup anterior para restaurar os dados.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            variant="subtle"
            onClick={handleExport}
            disabled={exporting}
            className="w-fit disabled:opacity-50"
          >
            <Download size={15} />
            {exporting ? 'Exportando...' : 'Exportar dados (JSON)'}
          </Button>

          {exportMsg && (
            <div
              className={`text-sm px-3 py-2 rounded-lg border ${
                exportMsg.type === 'ok'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {exportMsg.text}
            </div>
          )}

          <div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-border text-ink text-sm font-medium hover:bg-surface-subtle transition-colors w-fit disabled:opacity-50"
            >
              <Upload size={15} />
              {importing ? 'Importando...' : 'Importar dados (JSON)'}
            </button>
            <p className="text-xs text-ink/40 mt-1 ml-1">
              Atenção: mescla os dados importados com os existentes.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleImport}
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
      </Card>

      {/* Seção: Sobre */}
      <Card className="p-6">
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <Info size={16} className="text-ink/40" />
          Sobre
        </h2>
        <div className="space-y-1 text-sm text-ink/70">
          <p><span className="font-medium">Versão:</span> 0.2.0</p>
          <p><span className="font-medium">Banco de dados:</span> Supabase (PostgreSQL)</p>
          <p><span className="font-medium">Autenticação:</span> Supabase Auth</p>
        </div>
      </Card>
    </div>
  )
}
