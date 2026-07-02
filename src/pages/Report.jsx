import { useState, useEffect, useCallback, useMemo, useRef, forwardRef } from 'react'
import { ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react'
import { format, addWeeks, subWeeks, addDays } from 'date-fns'
import useAppStore from '../store/useAppStore'
import { getSlotsWithDetails } from '../api/slots'
import { getAssignmentsByWeek } from '../api/assignments'
import { getThisMonday, getPeriodFromTime } from '../lib/scheduleGrid'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const REPORT_DAYS = [1, 2, 3, 4, 5, 6, 0]
const DAY_OFFSET  = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 }

// Largura virtual usada pelo html2canvas ao capturar para PDF/imagem — garante que a
// exportação sempre saia em fidelidade desktop, independente da largura real da tela
// do usuário (ex.: exportar a partir de um celular).
const EXPORT_VIEWPORT_WIDTH = 1500

function buildReportGridByCart(slots, rawAssignments, brothers) {
  const brotherMap = {}
  for (const b of brothers) brotherMap[b.id] = b.name

  const assignMap = {}
  for (const a of rawAssignments) {
    assignMap[`${a.slot_id}-${a.position}`] = brotherMap[a.brother_id] ?? ''
  }

  const cartMap = {}
  for (const slot of slots) {
    const cartId = slot.cart_id ?? '__none__'
    const cartName = slot.cart_name || 'Sem Carrinho'
    const period = getPeriodFromTime(slot.start_time)

    if (!cartMap[cartId]) {
      cartMap[cartId] = { cart_id: cartId, cart_name: cartName, periods: {} }
    }
    if (!cartMap[cartId].periods[period]) {
      cartMap[cartId].periods[period] = { period, days: {} }
    }

    const names = []
    for (let pos = 1; pos <= slot.capacity; pos++) {
      names.push(assignMap[`${slot.id}-${pos}`] ?? '')
    }
    while (names.length > 1 && names[names.length - 1] === '') names.pop()

    const entry = {
      names,
      location: slot.location_name,
      time: `${slot.start_time}–${slot.end_time}`,
    }

    // Múltiplos slots no mesmo período/dia são acumulados em array
    if (!cartMap[cartId].periods[period].days[slot.day_of_week]) {
      cartMap[cartId].periods[period].days[slot.day_of_week] = []
    }
    cartMap[cartId].periods[period].days[slot.day_of_week].push(entry)
  }

  return Object.values(cartMap).map((cart) => ({
    ...cart,
    periods: ['MANHÃ', 'TARDE', 'NOITE'].map((p) => cart.periods[p]).filter(Boolean),
  }))
}

function buildBrotherRows(slots, rawAssignments, brothers, brotherId) {
  const brotherMap = {}
  for (const b of brothers) brotherMap[b.id] = b.name

  const slotMap = {}
  for (const slot of slots) slotMap[slot.id] = slot

  const rows = []
  for (const a of rawAssignments) {
    if (a.brother_id !== brotherId) continue
    const slot = slotMap[a.slot_id]
    if (!slot) continue

    const colleagues = rawAssignments
      .filter((other) => other.slot_id === a.slot_id && other.brother_id !== brotherId)
      .map((other) => brotherMap[other.brother_id])
      .filter(Boolean)

    rows.push({
      day_of_week: slot.day_of_week,
      time: `${slot.start_time}–${slot.end_time}`,
      location: slot.location_name,
      cart_name: slot.cart_name || 'Sem Carrinho',
      colleagues,
    })
  }

  return rows.sort((a, b) => {
    const dayDiff = DAY_OFFSET[a.day_of_week] - DAY_OFFSET[b.day_of_week]
    if (dayDiff !== 0) return dayDiff
    return a.time.localeCompare(b.time)
  })
}

const CARD_HEADER_COLORS = ['#f3e8fd', '#e3f0fb']

const BrotherCardReport = forwardRef(function BrotherCardReport({ brotherName, rows, monday, congregationName }, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        maxWidth: 400,
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #e8d5f2 0%, #d4e5f7 100%)',
          padding: '32px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600, color: '#2d3142', letterSpacing: '-0.5px' }}>
          {brotherName}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6, letterSpacing: '0.3px' }}>
          Arranjos
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{ background: '#f9f7fd', borderRadius: 8, overflow: 'hidden', border: '1px solid #eee6f7' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: CARD_HEADER_COLORS[i % CARD_HEADER_COLORS.length],
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2d3142' }}>
                {DAY_LABELS[row.day_of_week]} · {format(addDays(monday, DAY_OFFSET[row.day_of_week]), 'dd/MM')}
              </span>
              <span style={{ fontSize: 12, color: '#4b5563', fontWeight: 500 }}>{row.time}</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                borderTop: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {[
                ['Local', row.location],
                ['Carrinho', row.cart_name],
                ['Colega', row.colleagues.join(', ') || '—'],
              ].map(([label, value], ci) => (
                <div
                  key={label}
                  style={{
                    padding: '10px 12px',
                    borderRight: ci < 2 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: '#1f2937' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fafaf9', padding: '12px 24px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: 11, color: '#9ca3af' }}>
        Arranjo de Testemunho Público • {congregationName}
      </div>
    </div>
  )
})

export default function Report() {
  const { brothers, scheduleWeeks, congregationName } = useAppStore()
  const reportRef = useRef(null)
  const cardRef = useRef(null)

  const [monday, setMonday] = useState(getThisMonday)
  const [week, setWeek] = useState(null)
  const [slots, setSlots] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [mode, setMode] = useState('week')
  const [selectedBrotherId, setSelectedBrotherId] = useState('')
  const [brotherLayout, setBrotherLayout] = useState('table')

  const weekStart = format(monday, 'yyyy-MM-dd')
  const weekEnd   = format(addDays(monday, 6), 'dd/MM/yyyy')
  const weekLabel = `${format(monday, 'dd/MM')} a ${weekEnd}`

  const loadData = useCallback(async (w) => {
    setLoading(true)
    try {
      const [slotsData, assignmentsData] = await Promise.all([
        getSlotsWithDetails(),
        getAssignmentsByWeek(w.id),
      ])
      setSlots(slotsData)
      setAssignments(assignmentsData)
    } catch (err) {
      console.error('Erro ao carregar relatório:', err)
      setSlots([])
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const existing = scheduleWeeks.find((w) => w.week_start === weekStart) ?? null
    setWeek(existing)
    if (existing) {
      loadData(existing)
    } else {
      setSlots([])
      setAssignments([])
    }
  }, [scheduleWeeks, weekStart, loadData])

  const grid = useMemo(
    () => buildReportGridByCart(slots, assignments, brothers),
    [slots, assignments, brothers]
  )

  const brotherRows = useMemo(
    () => (selectedBrotherId ? buildBrotherRows(slots, assignments, brothers, selectedBrotherId) : []),
    [slots, assignments, brothers, selectedBrotherId]
  )
  const selectedBrotherName = brothers.find((b) => b.id === selectedBrotherId)?.name ?? ''
  const isBrotherCards = mode === 'brother' && brotherLayout === 'cards'

  async function handleExportPDF() {
    if (!reportRef.current) return
    setExporting(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      await html2pdf()
        .set({
          margin: [8, 8, 8, 8],
          filename: `testemunho_${weekStart}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, windowWidth: EXPORT_VIEWPORT_WIDTH },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        })
        .from(reportRef.current)
        .save()
    } finally {
      setExporting(false)
    }
  }

  async function handleExportImage() {
    if (!cardRef.current) return
    setExporting(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const worker = html2pdf()
        .set({ html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: EXPORT_VIEWPORT_WIDTH } })
        .from(cardRef.current)
        .toCanvas()
      await worker
      const canvas = worker.prop.canvas
      const link = document.createElement('a')
      link.download = `arranjo_${selectedBrotherName || 'irmao'}_${weekStart}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setExporting(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header da tela */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-4 md:px-8 py-4 border-b border-gray-200 bg-white shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonday((m) => subWeeks(m, 1))}
            className="p-2 rounded-lg border border-gray-300 text-slate-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-center min-w-[210px]">
            <p className="font-semibold text-slate-800 text-sm">Semana de {weekLabel}</p>
          </div>
          <button
            onClick={() => setMonday((m) => addWeeks(m, 1))}
            className="p-2 rounded-lg border border-gray-300 text-slate-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-slate-600 hover:bg-gray-50 transition-colors"
          >
            <Printer size={14} />
            Imprimir
          </button>
          <button
            onClick={mode === 'brother' && brotherLayout === 'cards' ? handleExportImage : handleExportPDF}
            disabled={!week || exporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-700 hover:bg-slate-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            {exporting
              ? 'Gerando...'
              : mode === 'brother' && brotherLayout === 'cards'
              ? 'Exportar Imagem'
              : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* Barra de modo do relatório */}
      <div className="flex items-center gap-3 flex-wrap gap-y-2 px-4 md:px-8 py-3 border-b border-gray-200 bg-white shrink-0 print:hidden">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Visão semanal
          </button>
          <button
            onClick={() => setMode('brother')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'brother' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Por irmão
          </button>
        </div>

        {mode === 'brother' && (
          <>
            <select
              value={selectedBrotherId}
              onChange={(e) => setSelectedBrotherId(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-slate-700 bg-white"
            >
              <option value="">Selecione um irmão...</option>
              {brothers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBrotherLayout('table')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  brotherLayout === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Tabela
              </button>
              <button
                onClick={() => setBrotherLayout('cards')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  brotherLayout === 'cards' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Cards
              </button>
            </div>
          </>
        )}
      </div>

      {/* Área de conteúdo */}
      <div className="flex-1 overflow-auto bg-gray-100 p-6 print:p-0 print:bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 text-sm">Carregando...</p>
          </div>
        ) : !week ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center max-w-sm">
              <p className="font-semibold text-slate-800 mb-1">Semana sem programação</p>
              <p className="text-sm text-slate-500">
                A semana de {weekLabel} ainda não possui programação criada.
                Acesse a tela de Programação para criar.
              </p>
            </div>
          </div>
        ) : (
          /* Folha do relatório — este div é capturado pelo html2pdf */
          <div className="overflow-x-auto">
          <div
            ref={reportRef}
            data-print-target
            className={
              isBrotherCards
                ? 'bg-white shadow-md mx-auto print:shadow-none'
                : 'bg-white shadow-md mx-auto print:shadow-none w-full max-w-[277mm] print:w-[277mm] print:min-h-[190mm]'
            }
            style={isBrotherCards ? { padding: '24px' } : { padding: '10mm' }}
          >
            {/* Cabeçalho do relatório */}
            {!isBrotherCards && (
              <div className="text-center mb-4">
                <h1
                  className="font-bold uppercase tracking-wide text-slate-800"
                  style={{ fontSize: '13pt' }}
                >
                  Arranjo de Testemunho Público com o Carrinho
                </h1>
                <p className="text-slate-600 mt-0.5" style={{ fontSize: '10pt' }}>
                  {congregationName} &nbsp;|&nbsp; Semana:{' '}
                  {format(monday, 'dd/MM/yyyy')} a {weekEnd}
                </p>
              </div>
            )}

            {/* Tabela do relatório: grade semanal, designações do irmão ou cards do irmão */}
            {isBrotherCards ? (
              !selectedBrotherId ? (
                <p className="text-center text-slate-400 py-8" style={{ fontSize: '10pt' }}>
                  Selecione um irmão para ver as designações.
                </p>
              ) : brotherRows.length === 0 ? (
                <p className="text-center text-slate-400 py-8" style={{ fontSize: '10pt' }}>
                  Nenhuma designação para {selectedBrotherName} nesta semana.
                </p>
              ) : (
                <BrotherCardReport
                  ref={cardRef}
                  brotherName={selectedBrotherName}
                  rows={brotherRows}
                  monday={monday}
                  congregationName={congregationName}
                />
              )
            ) : mode === 'week' ? (
              grid.length === 0 ? (
                <p className="text-center text-slate-400 py-8" style={{ fontSize: '10pt' }}>
                  Nenhum turno configurado ou designações vazias.
                </p>
              ) : (
                <div className="space-y-6">
                  {grid.map((cart) => (
                    <div key={cart.cart_id}>
                      <h2
                        className="text-center font-bold uppercase tracking-wide text-slate-800 mb-1"
                        style={{ fontSize: '11pt' }}
                      >
                        Carrinho {cart.cart_name}
                      </h2>
                      <table
                        className="w-full border-collapse"
                        style={{ fontSize: '9pt', tableLayout: 'fixed' }}
                      >
                        <colgroup>
                          <col style={{ width: '14%' }} />
                          {REPORT_DAYS.map((d) => (
                            <col key={d} style={{ width: `${86 / REPORT_DAYS.length}%` }} />
                          ))}
                        </colgroup>
                        <thead>
                          <tr>
                            <th
                              className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold"
                              style={{ fontSize: '8.5pt' }}
                            >
                              Período
                            </th>
                            {REPORT_DAYS.map((d) => {
                              const date = addDays(monday, DAY_OFFSET[d])
                              return (
                                <th
                                  key={d}
                                  className="border border-slate-400 bg-slate-700 text-white px-1 py-1 text-center font-semibold"
                                  style={{ fontSize: '8.5pt' }}
                                >
                                  {DAY_LABELS[d]}
                                  <br />
                                  <span style={{ fontSize: '7.5pt', fontWeight: 400 }}>
                                    {format(date, 'dd/MM')}
                                  </span>
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {cart.periods.map((periodObj) => (
                            <tr key={periodObj.period}>
                              <td
                                className="border border-slate-300 px-2 py-1 font-semibold bg-slate-50 text-slate-700"
                                style={{ fontSize: '8pt' }}
                              >
                                {periodObj.period}
                              </td>
                              {REPORT_DAYS.map((d) => {
                                const dayEntries = periodObj.days[d]
                                return (
                                  <td
                                    key={d}
                                    className="border border-slate-300 px-1 py-1 align-top text-center"
                                    style={{ verticalAlign: 'top' }}
                                  >
                                    {dayEntries && dayEntries.length > 0 ? (
                                      <div className="flex flex-col gap-1">
                                        {dayEntries.map((data, ei) => (
                                          <div key={ei} className={ei > 0 ? 'border-t border-slate-200 pt-1' : ''}>
                                            {data.names.map((name, i) => (
                                              <div
                                                key={i}
                                                className="text-slate-800 leading-snug"
                                                style={{ fontSize: '8.5pt', minHeight: '13pt' }}
                                              >
                                                {name || ''}
                                              </div>
                                            ))}
                                            <div className="text-slate-500" style={{ fontSize: '7pt' }}>
                                              {data.location}
                                            </div>
                                            <div className="text-slate-400 font-mono" style={{ fontSize: '7pt' }}>
                                              {data.time}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div style={{ minHeight: '13pt' }} />
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )
            ) : !selectedBrotherId ? (
              <p className="text-center text-slate-400 py-8" style={{ fontSize: '10pt' }}>
                Selecione um irmão para ver as designações.
              </p>
            ) : brotherRows.length === 0 ? (
              <p className="text-center text-slate-400 py-8" style={{ fontSize: '10pt' }}>
                Nenhuma designação para {selectedBrotherName} nesta semana.
              </p>
            ) : (
              <div>
                <h2
                  className="text-center font-bold uppercase tracking-wide text-slate-800 mb-1"
                  style={{ fontSize: '11pt' }}
                >
                  Designações de {selectedBrotherName}
                </h2>
                <table className="w-full border-collapse" style={{ fontSize: '9pt' }}>
                  <thead>
                    <tr>
                      <th className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold" style={{ fontSize: '8.5pt' }}>
                        Dia
                      </th>
                      <th className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold" style={{ fontSize: '8.5pt' }}>
                        Data
                      </th>
                      <th className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold" style={{ fontSize: '8.5pt' }}>
                        Horário
                      </th>
                      <th className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold" style={{ fontSize: '8.5pt' }}>
                        Local
                      </th>
                      <th className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold" style={{ fontSize: '8.5pt' }}>
                        Carrinho
                      </th>
                      <th className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold" style={{ fontSize: '8.5pt' }}>
                        Colegas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {brotherRows.map((row, i) => (
                      <tr key={i}>
                        <td className="border border-slate-300 px-2 py-1 text-slate-800" style={{ fontSize: '8.5pt' }}>
                          {DAY_LABELS[row.day_of_week]}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-slate-800" style={{ fontSize: '8.5pt' }}>
                          {format(addDays(monday, DAY_OFFSET[row.day_of_week]), 'dd/MM')}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-slate-800 font-mono" style={{ fontSize: '8.5pt' }}>
                          {row.time}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-slate-800" style={{ fontSize: '8.5pt' }}>
                          {row.location}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-slate-800" style={{ fontSize: '8.5pt' }}>
                          {row.cart_name}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-slate-800" style={{ fontSize: '8.5pt' }}>
                          {row.colleagues.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Rodapé */}
            {!isBrotherCards && (
              <div className="mt-4 text-right text-slate-400" style={{ fontSize: '7pt' }}>
                Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}
              </div>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  )
}
