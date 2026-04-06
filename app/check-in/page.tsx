import { Suspense } from 'react'
import CheckInExperience from '@/components/CheckInExperience'

export default function CheckInPage() {
  return (
    <Suspense fallback={null}>
      <CheckInExperience />
    </Suspense>
  )
}
