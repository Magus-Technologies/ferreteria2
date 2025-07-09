import { useRouter } from 'next/navigation'
import { LoginValues } from '../page'

export default function useLogin() {
  const router = useRouter()

  function login(values: LoginValues) {
    console.log('🚀 ~ file: use-login.ts:8 ~ values:', values)
    router.push('/ui')
  }

  return {
    login,
  }
}
