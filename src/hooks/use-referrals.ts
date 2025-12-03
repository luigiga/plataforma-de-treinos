import { useState, useEffect } from 'react'
import { referralService } from '@/services/payments/referrals'

/**
 * Hook para gerenciar links de referência
 */
export function useReferral() {
  const [referralTrainerId, setReferralTrainerId] = useState<string | null>(null)

  useEffect(() => {
    const ref = referralService.getReferralFromUrl()
    setReferralTrainerId(ref)
  }, [])

  const clearReferral = () => {
    referralService.clearReferral()
    setReferralTrainerId(null)
  }

  const generateLink = (trainerId: string) => {
    return referralService.generateReferralLink(trainerId)
  }

  return {
    referralTrainerId,
    hasReferral: !!referralTrainerId,
    clearReferral,
    generateLink,
  }
}

