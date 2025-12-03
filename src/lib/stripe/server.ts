import Stripe from 'stripe'

// Cliente Stripe para backend (server-side)
// Este arquivo será usado em Edge Functions ou API routes
export const getStripeServer = (): Stripe => {
  const secretKey = process.env.STRIPE_SECRET_KEY || import.meta.env.VITE_STRIPE_SECRET_KEY
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY não configurada')
  }

  return new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  })
}

