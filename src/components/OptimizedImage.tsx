import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string
  alt: string
  className?: string
  placeholder?: string
  fallback?: string
  lazy?: boolean
}

/**
 * Componente de imagem otimizado com lazy loading
 * - Carrega imagens apenas quando visíveis (lazy loading)
 * - Mostra placeholder durante carregamento
 * - Fallback para erro de carregamento
 * - Suporta todas as props padrão de img
 */
export function OptimizedImage({
  src,
  alt,
  className,
  placeholder,
  fallback = '/placeholder.svg',
  lazy = true,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder || fallback)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!lazy) {
      // Se não for lazy, carrega imediatamente
      setImageSrc(src)
      return
    }

    // Intersection Observer para lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Começa a carregar 50px antes de aparecer
      },
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [src, lazy])

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    setImageSrc(fallback)
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={cn(
        'transition-opacity duration-300',
        isLoading && 'opacity-0',
        !isLoading && !hasError && 'opacity-100',
        hasError && 'opacity-50',
        className,
      )}
      onLoad={handleLoad}
      onError={handleError}
      loading={lazy ? 'lazy' : 'eager'}
      {...props}
    />
  )
}

