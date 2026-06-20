'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Input, Select, Checkbox, Button, Switch, Tag, Tooltip, message, Spin, Empty } from 'antd'
import { DeleteOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { cargosApi, type Cargo } from '~/lib/api/catalogos'
import { permissionsApi, type Role } from '~/lib/api/permissions'

interface Position {
  x: number
  y: number
}

interface ModalState {
  visible: boolean
  isNew: boolean
  codigo: string
  descripcion: string
  parent: string | null
  highlight: boolean
  staff: boolean
  visible_organigrama: boolean
  role_id: number | null
  estado: boolean
  users_count: number
}

const MODAL_INICIAL: ModalState = {
  visible: false,
  isNew: true,
  codigo: '',
  descripcion: '',
  parent: null,
  highlight: false,
  staff: false,
  visible_organigrama: true,
  role_id: null,
  estado: true,
  users_count: 0,
}

const GOLD = '#C9A227'
const BOX_W = 170
const BOX_H = 44
const GAP_X = 24
const GAP_Y = 68

export default function TabOrganigramo() {
  const queryClient = useQueryClient()
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [positions, setPositions] = useState<Record<string, Position>>({})
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number } | null>(null)
  const [didDrag, setDidDrag] = useState(false)
  const [modal, setModal] = useState<ModalState>(MODAL_INICIAL)
  const [ocultosVisible, setOcultosVisible] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Refrescar los catálogos/queries que consumen cargos (tab de Cargos, selects, etc.)
  const invalidarQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['cargos-gestion'] })
    queryClient.invalidateQueries({ queryKey: ['catalogos', 'cargos'] })
  }

  const loadCargos = async () => {
    setLoading(true)
    try {
      const data = await cargosApi.listGestion()
      setCargos(data)
    } catch (e) {
      message.error('Error al cargar cargos')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const res = await permissionsApi.getRolesGestion()
      setRoles((res.data?.data ?? []).filter((r) => r.estado !== false))
    } catch (e) {
      console.error(e)
    }
  }

  // Cargar cargos y roles
  useEffect(() => {
    loadCargos()
    loadRoles()
  }, [])

  // Recalcular layout cuando cambien los cargos
  useEffect(() => {
    if (cargos.length > 0) {
      buildLayout()
    }
  }, [cargos])

  const buildLayout = () => {
    // Solo se dibujan los cargos marcados como visibles en el organigrama.
    // Los ocultos no reciben posición, por lo que renderLines y el render de
    // nodos (que dependen de positions[codigo]) los omiten automáticamente.
    const visibles = cargos.filter(c => c.visible_organigrama !== false)

    const byId: Record<string, Cargo & { children: (Cargo & { children: any[] })[] }> = {}
    visibles.forEach(c => {
      byId[c.codigo] = { ...c, children: [] }
    })

    const roots: (Cargo & { children: any[] })[] = []
    visibles.forEach(c => {
      if (c.staff) return
      // Si el padre está oculto (no está en byId) el hijo pasa a ser raíz para
      // que no desaparezca junto con el padre.
      if (!c.parent || !byId[c.parent]) roots.push(byId[c.codigo])
      else byId[c.parent].children.push(byId[c.codigo])
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

    // Staff nodes (solo visibles)
    visibles.filter(c => c.staff && c.parent).forEach(c => {
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
    setModal({ ...MODAL_INICIAL, visible: true, isNew: true })
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
        visible_organigrama: cargo.visible_organigrama !== false,
        role_id: cargo.role_id ?? null,
        estado: cargo.estado !== false,
        users_count: cargo.users_count ?? 0,
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
      visible_organigrama: modal.visible_organigrama,
      role_id: modal.role_id ?? null,
      estado: modal.estado,
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
      invalidarQueries()
      setModal(MODAL_INICIAL)
    } catch (error) {
      message.error('Error al guardar el cargo')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const deleteNode = async () => {
    if (modal.users_count > 0) {
      message.warning('Este cargo está en uso por usuarios. Desactívalo en lugar de eliminarlo.')
      return
    }
    setLoading(true)
    try {
      await cargosApi.delete(modal.codigo)
      await loadCargos()
      invalidarQueries()
      setModal(MODAL_INICIAL)
      message.success('Cargo eliminado')
    } catch (error) {
      message.error('Error al eliminar el cargo')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Cargos ocultos del organigrama: no se dibujan en el canvas, por lo que
  // se gestionan desde el modal de "Ocultos".
  const ocultos = cargos.filter(c => c.visible_organigrama === false)

  const mostrarEnOrganigrama = async (cargo: Cargo) => {
    setLoading(true)
    try {
      await cargosApi.update(cargo.codigo, {
        codigo: cargo.codigo,
        descripcion: cargo.descripcion,
        parent: cargo.parent ?? null,
        highlight: cargo.highlight ?? false,
        staff: cargo.staff ?? false,
        visible_organigrama: true,
        role_id: cargo.role_id ?? null,
        estado: cargo.estado !== false,
      })
      await loadCargos()
      invalidarQueries()
      message.success(`"${cargo.descripcion}" se volvió a mostrar en el organigrama`)
    } catch (error) {
      message.error('Error al mostrar el cargo en el organigrama')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const editarOculto = (codigo: string) => {
    setOcultosVisible(false)
    openEdit(codigo)
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
        .org-node.inactive { opacity: .4; filter: grayscale(1); }
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
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setOcultosVisible(true)}
            className='bg-white text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1 hover:bg-gray-50'
          >
            <EyeOutlined /> Ocultos
            {ocultos.length > 0 && (
              <span className='inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-yellow-600 text-white text-[10px] leading-none'>
                {ocultos.length}
              </span>
            )}
          </button>
          <button
            onClick={openNew}
            className='bg-yellow-600 text-white border-0 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1 hover:opacity-85'
          >
            + Nuevo cargo
          </button>
        </div>
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
                className={`org-node ${dragging?.id === cargo.codigo ? 'dragging' : ''} ${cargo.highlight ? 'highlight' : ''} ${cargo.staff ? 'staff' : ''} ${cargo.estado === false ? 'inactive' : ''}`}
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
            <label className='block text-xs text-gray-600 mb-1'>Reporta a (cargo superior)</label>
            <Select
              allowClear
              showSearch
              optionFilterProp='label'
              placeholder='Selecciona el cargo superior'
              className='w-full'
              value={modal.parent || undefined}
              onChange={v => setModal({ ...modal, parent: v || null })}
              options={cargos.filter(c => c.codigo !== modal.codigo).map(c => ({ label: c.descripcion, value: c.codigo }))}
            />
          </div>

          <div>
            <label className='block text-xs text-gray-600 mb-1'>Rol relacionado (opcional)</label>
            <Select
              allowClear
              showSearch
              optionFilterProp='label'
              placeholder='Sin rol relacionado'
              className='w-full'
              value={modal.role_id ?? undefined}
              onChange={v => setModal({ ...modal, role_id: v ?? null })}
              options={roles.map(r => ({ label: r.name, value: r.id }))}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Switch
                checked={modal.estado}
                onChange={checked => setModal({ ...modal, estado: checked })}
              />
              <span className='text-xs text-gray-600'>{modal.estado ? 'Activo' : 'Inactivo'}</span>
            </div>
            {!modal.isNew && modal.users_count > 0 && (
              <Tag color='blue'>{modal.users_count} usuario(s) con este cargo</Tag>
            )}
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

          <div className='rounded border border-slate-200 bg-slate-50 px-3 py-2'>
            <Checkbox
              checked={modal.visible_organigrama}
              onChange={e => setModal({ ...modal, visible_organigrama: e.target.checked })}
            >
              Mostrar en organigrama
            </Checkbox>
            <div className='text-[11px] text-gray-500 mt-1'>
              Si lo desmarcas, el cargo no se dibuja en el organigrama pero sigue
              siendo asignable a usuarios y visible en el tab de Cargos.
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de cargos ocultos */}
      <Modal
        title='Cargos ocultos del organigrama'
        open={ocultosVisible}
        onCancel={() => setOcultosVisible(false)}
        footer={null}
      >
        {ocultos.length === 0 ? (
          <Empty description='No hay cargos ocultos' image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className='space-y-2'>
            <div className='text-[12px] text-gray-500 mb-2'>
              Estos cargos no se dibujan en el organigrama. Pulsa
              {' '}<EyeOutlined />{' '}para volver a mostrarlos.
            </div>
            {ocultos.map(cargo => (
              <div
                key={cargo.codigo}
                className='flex items-center justify-between gap-2 rounded border border-slate-200 px-3 py-2'
              >
                <div className='min-w-0'>
                  <div className='text-sm font-medium text-gray-800 truncate'>{cargo.descripcion}</div>
                  <div className='text-[11px] text-gray-400 truncate'>{cargo.codigo}</div>
                </div>
                <div className='flex items-center gap-1 shrink-0'>
                  <Button
                    size='small'
                    icon={<EditOutlined />}
                    onClick={() => editarOculto(cargo.codigo)}
                  >
                    Editar
                  </Button>
                  <Button
                    type='primary'
                    size='small'
                    icon={<EyeOutlined />}
                    onClick={() => mostrarEnOrganigrama(cargo)}
                  >
                    Mostrar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Botón de eliminar en modal */}
      {modal.visible && !modal.isNew && (
        <div className='flex justify-end gap-2 mt-2'>
          {modal.users_count > 0 ? (
            <Tooltip title='En uso por usuarios. Desactívalo en lugar de eliminar.'>
              <Button danger icon={<DeleteOutlined />} disabled>
                Eliminar
              </Button>
            </Tooltip>
          ) : (
            <Button danger icon={<DeleteOutlined />} onClick={deleteNode}>
              Eliminar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
