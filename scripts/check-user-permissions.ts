import { prisma } from '~/db/db'

async function checkUserPermissions() {
  const user = await prisma.user.findFirst({
    where: { email: 'admin@aplication.com' },
    select: {
      id: true,
      name: true,
      email: true,
      permissions: {
        select: {
          name: true,
        },
      },
      roles: {
        select: {
          name: true,
          permissions: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    console.log('Usuario no encontrado')
    return
  }

  const all_permissions = Array.from(
    new Set([
      ...user.permissions.map((p) => p.name),
      ...user.roles.flatMap((role) => role.permissions.map((p) => p.name)),
    ])
  )

  console.log('Usuario:', user.name)
  console.log('Email:', user.email)
  console.log('\nPermisos directos:', user.permissions.map((p) => p.name))
  console.log('\nRoles:', user.roles.map((r) => r.name))
  console.log('\nTodos los permisos:')
  all_permissions.sort().forEach((p) => console.log(`  - ${p}`))
  
  console.log('\n¿Tiene caja-principal.listado?', all_permissions.includes('caja-principal.listado'))
}

checkUserPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
