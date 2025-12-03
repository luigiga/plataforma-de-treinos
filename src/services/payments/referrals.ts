import { logger } from '@/lib/logger'

/**
 * Serviço para gerenciar links de referência
 */

export const referralService = {
  /**
   * Obter trainer_id da URL (query param ?ref=trainer_id)
   */
  getReferralFromUrl(): string | null {
    if (typeof window === 'undefined') return null

    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')

    if (ref) {
      // Salvar no localStorage para persistir durante a sessão
      localStorage.setItem('referral_trainer_id', ref)
      return ref
    }

    // Tentar recuperar do localStorage se não estiver na URL
    return localStorage.getItem('referral_trainer_id')
  },

  /**
   * Limpar referral (após processar pagamento)
   */
  clearReferral() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('referral_trainer_id')
  },

  /**
   * Gerar link de referência
   */
  generateReferralLink(trainerId: string, baseUrl?: string): string {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${base}/plans?ref=${trainerId}`
  },

  /**
   * Verificar se há referral ativo
   */
  hasReferral(): boolean {
    return this.getReferralFromUrl() !== null
  },
}

