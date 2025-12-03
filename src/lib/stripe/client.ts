import { loadStripe, Stripe } from '@stripe/stripe-js'

// Cliente Stripe para frontend (browser)
let stripePromise: Promise<Stripe | null> | null = null

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    if (!publishableKey) {
      console.warn('VITE_STRIPE_PUBLISHABLE_KEY não configurada')
      return Promise.resolve(null)
    }
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

