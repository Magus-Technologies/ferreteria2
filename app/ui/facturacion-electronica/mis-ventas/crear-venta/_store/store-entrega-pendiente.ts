import { create } from 'zustand'

/**
 * Datos de entrega que el modal dejó listos pero TODAVÍA NO se guardaron.
 *
 * Al editar una venta existente, confirmar el modal de entrega no persiste nada
 * (`soloRegistrar`): el guardado es del botón "Guardar Cambios". Hace falta
 * llevar esos datos desde el modal hasta el submit sin pasarlos por el
 * formulario.
 *
 * Por qué no el formulario: el payload que arma el modal (`leerValoresVenta` +
 * `cantidades_parciales` + la config de la entrega) no es un espejo de los
 * campos del form — trae claves calculadas y valores ya transformados. Al
 * escribirlo con `setFieldsValue` y volver a leerlo en el submit, las
 * `cantidades_parciales` no sobrevivían el viaje, y `use-create-venta` decide
 * justamente con ellas si toca la entrega en una edición:
 *
 *     const ejecutarBloqueDomicilio = ... && (!isEditing || tieneSplitDomicilio)
 *
 * Sin ellas el bloque no corría: la venta se guardaba, la entrega quedaba
 * intacta y el vendedor perdía en silencio el chofer, el vehículo y el horario
 * que acababa de programar.
 *
 * El submit hace merge de esto sobre los valores del form y lo limpia al
 * terminar, así no se arrastra a la próxima edición.
 */
type UseStoreEntregaPendiente = {
  valores: Record<string, any> | null
  setValores: (valores: Record<string, any> | null) => void
}

export const useStoreEntregaPendiente = create<UseStoreEntregaPendiente>(set => ({
  valores: null,
  setValores: valores => set({ valores }),
}))
