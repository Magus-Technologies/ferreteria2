'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Input, Select, Checkbox, Button, message, Spin } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { cargosApi, type Cargo } from '~/lib/api/catalogos'

interface Position {
  x: number
  y: number
}

const GOLD = '#C9A227'
const BOX_W = 170
const BOX_H = 44
const GAP_X = 24
const GAP_Y = 68

export default function TabOrganigramo() {
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [positions, setPositions] = useState<Record<string, Position>>({})
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number } | null>(null)
  const [didDrag, setDidDrag] = useState(false)
  const [modal, setModal] = useState<{ visible: boolean; isNew: boolean; codigo: string; descripcion: string; parent: string | null; highlight: boolean; staff: boolean }>({
    visible: false,
    isNew: true,
    codigo: '',
    descripcion: '',
    parent: null,
    highlight: false,
    staff: false,
  })
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const loadCargos = async () => {
    setLoading(true)
    try {
      const data = await cargosApi.list()
      setCargos(data)
    } catch (e) {
      message.error('Error al cargar cargos')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Cargar cargos
  useEffect(() => {
    loadCargos()
  }, [])

  // Recalcular layout cuando cambien los cargos
  useEffect(() => {
    if (cargos.length > 0) {
      buildLayout()
    }
  }, [cargos])

  const buildLayout = () => {
    const byId: Record<string, Cargo & { children: (Cargo & { children: any[] })[] }> = {}
    cargos.forEach(c => {
      byId[c.codigo] = { ...c, children: [] }
    })

    const roots: (Cargo & { children: any[] })[] = []
    cargos.forEach(c => {
      if (c.staff) return
      if (!c.parent) roots.push(byId[c.codigo])
      else if (byId[c.parent]) byId[c.parent].children.push(byId[c.codigo])
    })

    const newPositions: Record<string, Position> = {}

    function layout(list: any[], y: number, left: number, right: number) {
      if (!list.length) return
      const total = list.length * BOX_W + (list.length - 1) * GAP_X
      const startX = Math.max(left, (left + right) / 2 - total / 2)
      list.forEach((node, i) => {
        const x = startX + i * (BOX_W + GAP_X)
        newPositions[node.codigo] = { x, y }
        if (node.children.length) {
          layout(node.children, y + BOX_H + GAP_Y, x - GAP_X / 2, x + BOX_W + GAP_X / 2)
        }
      })
    }

    layout(roots, 20, 20, 800)

    // Staff nodes
    cargos.filter(c => c.staff && c.parent).forEach(c => {
      const p = newPositions[c.parent!]
      if (p) newPositions[c.codigo] = { x: p.x + BOX_W + 50, y: p.y }
    })

    setPositions(newPositions)
  }

  const renderLines = () => {
    if (!Array.isArray(cargos)) return ''
    return cargos
      .map(c => {
        const pos = positions[c.codigo]
        if (!pos) return ''

        if (c.staff && c.parent && positions[c.parent]) {
          const p = positions[c.parent]
          const y = p.y + BOX_H / 2
          return `<line x1="${p.x + BOX_W}" y1="${y}" x2="${pos.x}" y2="${y}" stroke="${GOLD}" stroke-width="1.2" stroke-dasharray="5 3"/>`
        }

        if (c.parent && positions[c.parent]) {
          const pp = positions[c.parent]
          const px = pp.x + BOX_W / 2
          const py = pp.y + BOX_H
          const cx = pos.x + BOX_W / 2
          const cy = pos.y
          const siblings = cargos.filter(s => s.parent === c.parent && !s.staff)
          if (siblings.length > 1) {
            const my = py + (cy - py) * 0.45
            return `<path d="M${px},${py} L${px},${my} L${cx},${my} L${cx},${cy}" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity=".7"/>`
          } else {
            return `<line x1="${px}" y1="${py}" x2="${cx}" y2="${cy}" stroke="${GOLD}" stroke-width="1.2" opacity=".7"/>`
          }
        }
        return ''
      })
      .join('')
  }

  const openNew = () => {
    setModal({ visible: true, isNew: true, codigo: '', descripcion: '', parent: null, highlight: false, staff: false })
  }

  const openEdit = (codigo: string) => {
    const cargo = cargos.find(c => c.codigo === codigo)
    if (cargo) {
      setModal({
        visible: true,
        isNew: false,
        codigo: cargo.codigo,
        descripcion: cargo.descripcion,
        parent: cargo.parent || null,
        highlight: cargo.highlight || false,
        staff: cargo.staff || false,
      })
    }
  }

  const handleNodeClick = (codigo: string) => {
    if (didDrag) return
    openEdit(codigo)
  }

  const saveModal = async () => {
    if (!modal.codigo || !modal.descripcion) {
      message.error('Nombre y descripción son requeridos')
      return
    }

    const newCargo: Cargo = {
      codigo: modal.codigo.toUpperCase(),
      descripcion: modal.descripcion,
      parent: modal.parent,
      highlight: modal.highlight,
      staff: modal.staff,
    }

    setLoading(true)
    try {
      if (modal.isNew) {
        await cargosApi.create(newCargo)
        message.success('Cargo creado')
      } else {
        await cargosApi.update(modal.codigo, newCargo)
        message.success('Cargo actualizado')
      }
      await loadCargos()
      setModal({ visible: false, isNew: true, codigo: '', descripcion: '', parent: null, highlight: false, staff: false })
    } catch (error) {
      message.error('Error al guardar el cargo')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const deleteNode = async () => {
    setLoading(true)
    try {
      await cargosApi.delete(modal.codigo)
      await loadCargos()
      setModal({ visible: false, isNew: true, codigo: '', descripcion: '', parent: null, highlight: false, staff: false })
      message.success('Cargo eliminado')
    } catch (error) {
      message.error('Error al eliminar el cargo')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleMouseDown = (codigo: string, e: React.MouseEvent) => {
    if (e.button !== 0) return
    const pos = positions[codigo]
    if (pos) {
      setDragging({ id: codigo, startX: pos.x - e.clientX, startY: pos.y - e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const newPos = { x: Math.max(0, e.clientX + dragging.startX), y: Math.max(0, e.clientY + dragging.startY) }
    setDidDrag(true)
    setPositions({ ...positions, [dragging.id]: newPos })
  }

  const handleMouseUp = () => {
    setDragging(null)
    setTimeout(() => setDidDrag(false), 0)
  }

  const maxX = Math.max(400, ...Object.values(positions).map(p => p.x + BOX_W + 40))
  const maxY = Math.max(300, ...Object.values(positions).map(p => p.y + BOX_H + 40))

  if (loading) return <Spin />

  return (
    <div className='w-full'>
      <style>{`
        .org-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 0.5px solid #e5e7eb; background: #fff; }
        .org-hint { text-align: center; font-size: 11px; color: #9ca3af; padding: 6px 0 2px; }
        .org-canvas-wrap { overflow: auto; padding: 16px; min-height: 520px; position: relative; background: #f9fafb; }
        .org-canvas { position: relative; }
        .org-node { position: absolute; cursor: grab; user-select: none; background: #fff; border: 1.5px solid ${GOLD}; border-radius: 6px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 9px; font-weight: 600; color: #1f2937; letter-spacing: .04em; line-height: 1.3; padding: 4px 6px; transition: box-shadow .1s; }
        .org-node:hover { box-shadow: 0 0 0 2px ${GOLD}4d; }
        .org-node.highlight { background: ${GOLD}; color: #fff; border-color: ${GOLD}; }
        .org-node.staff { border-style: dashed; }
        .org-node.dragging { opacity: 0.8; cursor: grabbing; z-index: 100; box-shadow: 0 4px 16px #0002; }
        .org-footer { display: flex; gap: 14px; padding: 8px 16px 12px; font-size: 10px; color: #6b7280; flex-wrap: wrap; }
        .org-footer span { display: flex; align-items: center; gap: 5px; }
        .lg-std { width: 14px; height: 10px; border-radius: 2px; border: 1px solid ${GOLD}; background: #fff; display: inline-block; }
        .lg-hi { width: 14px; height: 10px; border-radius: 2px; background: ${GOLD}; display: inline-block; }
        .lg-dash { width: 18px; border-top: 1.5px dashed ${GOLD}; display: inline-block; }
      `}</style>

      <div className='org-header'>
        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500'>
          <div className='w-2 h-2 rounded-full bg-yellow-600' />
          Organigrama empresarial
        </div>
        <button
          onClick={openNew}
          className='bg-yellow-600 text-white border-0 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1 hover:opacity-85'
        >
          + Nuevo cargo
        </button>
      </div>

      <div className='org-hint'>Haz clic para editar · Arrastra para mover</div>

      <div className='org-canvas-wrap' onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div className='org-canvas' ref={canvasRef} style={{ width: maxX, height: maxY }}>
          <svg ref={svgRef} width={maxX} height={maxY} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }} dangerouslySetInnerHTML={{ __html: renderLines() }} />

          {cargos.map(cargo => {
            const pos = positions[cargo.codigo]
            if (!pos) return null
            return (
              <div
                key={cargo.codigo}
                className={`org-node ${dragging?.id === cargo.codigo ? 'dragging' : ''} ${cargo.highlight ? 'highlight' : ''} ${cargo.staff ? 'staff' : ''}`}
                style={{ left: pos.x, top: pos.y, width: BOX_W, height: BOX_H }}
                onMouseDown={e => handleMouseDown(cargo.codigo, e)}
                onClick={() => handleNodeClick(cargo.codigo)}
              >
                {cargo.descripcion}
              </div>
            )
          })}
        </div>
      </div>

      <div className='org-footer'>
        <span>
          <span className='lg-std' />
          Cargo estándar
        </span>
        <span>
          <span className='lg-hi' />
          Cargo destacado
        </span>
        <span>
          <span className='lg-dash' />
          Relación staff
        </span>
      </div>

      {/* Modal */}
      <Modal
        title={modal.isNew ? 'Nuevo cargo' : 'Editar cargo'}
        open={modal.visible}
        onOk={saveModal}
        onCancel={() => setModal({ ...modal, visible: false })}
        okText='Guardar'
        cancelText='Cancelar'
      >
        <div className='space-y-4'>
          <div>
            <label className='block text-xs text-gray-600 mb-1'>Nombre del cargo</label>
            <Input
              value={modal.codigo}
              onChange={e => setModal({ ...modal, codigo: e.target.value.toUpperCase() })}
              placeholder='EJ: GERENTE COMERCIAL'
            />
          </div>

          <div>
            <label className='block text-xs text-gray-600 mb-1'>Descripción</label>
            <Input
              value={modal.descripcion}
              onChange={e => setModal({ ...modal, descripcion: e.target.value })}
              placeholder='Descripción del cargo'
            />
          </div>

          <div>
            <label className='block text-xs text-gray-600 mb-1'>Reporta a</label>
            <Select
              allowClear
              placeholder='Selecciona el cargo superior'
              value={modal.parent || undefined}
              onChange={v => setModal({ ...modal, parent: v || null })}
              options={cargos.filter(c => c.codigo !== modal.codigo).map(c => ({ label: c.descripcion, value: c.codigo }))}
            />
          </div>

          <div className='flex gap-4'>
            <Checkbox
              checked={modal.highlight}
              onChange={e => setModal({ ...modal, highlight: e.target.checked })}
            >
              Fondo dorado
            </Checkbox>
            <Checkbox
              checked={modal.staff}
              onChange={e => setModal({ ...modal, staff: e.target.checked })}
            >
              Cargo staff
            </Checkbox>
          </div>
        </div>
      </Modal>

      {/* Botón de eliminar en modal */}
      {modal.visible && !modal.isNew && (
        <div className='flex justify-end gap-2 mt-2'>
          <Button danger icon={<DeleteOutlined />} onClick={deleteNode}>
            Eliminar
          </Button>
        </div>
      )}
    </div>
  )
}
