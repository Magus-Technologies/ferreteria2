export default function usePermission() {
  function can(permiso: string) {
    return !!permiso
  }

  return can
}
