import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export interface Product {
  id: string
  name: string
  description: string | null
  type: 'subscription' | 'one_time'
  price: number
  currency: string
  billing_period: 'month' | 'year' | null
  trainer_id: string | null
  workout_id: string | null
  stripe_product_id: string | null
  stripe_price_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateProductParams {
  name: string
  description?: string
  type: 'subscription' | 'one_time'
  price: number
  currency?: string
  billing_period?: 'month' | 'year'
  trainer_id?: string
  workout_id?: string
}

export const productService = {
  /**
   * Buscar todos os produtos ativos
   */
  async getProducts(filters?: {
    type?: 'subscription' | 'one_time'
    trainer_id?: string
    workout_id?: string
  }) {
    try {
      let query = supabase
        .from('payment_products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      if (filters?.trainer_id) {
        query = query.eq('trainer_id', filters.trainer_id)
      }
      if (filters?.workout_id) {
        query = query.eq('workout_id', filters.workout_id)
      }

      const { data, error } = await query

      if (error) {
        logger.error('Error fetching products', error)
        throw error
      }

      return (data || []) as Product[]
    } catch (error) {
      logger.error('Error in productService.getProducts', error)
      throw error
    }
  },

  /**
   * Buscar produto por ID
   */
  async getProductById(id: string) {
    try {
      const { data, error } = await supabase
        .from('payment_products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        logger.error('Error fetching product', error)
        throw error
      }

      return data as Product
    } catch (error) {
      logger.error('Error in productService.getProductById', error)
      throw error
    }
  },

  /**
   * Buscar produto por workout_id
   */
  async getProductByWorkoutId(workoutId: string) {
    try {
      const { data, error } = await supabase
        .from('payment_products')
        .select('*')
        .eq('workout_id', workoutId)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        logger.error('Error fetching product by workout', error)
        throw error
      }

      return data as Product | null
    } catch (error) {
      logger.error('Error in productService.getProductByWorkoutId', error)
      throw error
    }
  },

  /**
   * Criar produto (apenas admin)
   */
  async createProduct(params: CreateProductParams) {
    try {
      const { data, error } = await supabase
        .from('payment_products')
        .insert({
          ...params,
          currency: params.currency || 'BRL',
        })
        .select()
        .single()

      if (error) {
        logger.error('Error creating product', error)
        throw error
      }

      return data as Product
    } catch (error) {
      logger.error('Error in productService.createProduct', error)
      throw error
    }
  },
}

