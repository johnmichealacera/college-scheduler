'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function SignInPage() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormValues) => {
    setFormError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (result?.error) {
      setFormError('Incorrect email or password.')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3">
          <Calendar size={18} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Sign in to ClassSync</h1>
        <p className="text-sm text-gray-500 mt-1">School scheduling — coordinators only</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting} className="mt-1">
          Sign in
        </Button>
      </form>
    </div>
  )
}
