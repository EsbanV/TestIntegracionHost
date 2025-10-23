import { useState, useEffect, useCallback, useMemo } from 'react'

interface UseVirtualizedScrollProps {
  itemHeight: number
  containerHeight: number
  fetchMore: () => Promise<void>
  hasMore: boolean
  totalItems: number
  threshold?: number
}

export const useVirtualizedScroll = ({ 
  itemHeight,
  containerHeight,
  fetchMore, 
  hasMore,
  totalItems,
  threshold = 300 
}: UseVirtualizedScrollProps) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [isFetching, setIsFetching] = useState(false)

  // Calcular qué elementos son visibles
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight)
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
      totalItems
    )
    
    return {
      start: Math.max(0, visibleStart - 2), // Buffer de 2 elementos arriba
      end: Math.min(totalItems, visibleEnd + 2) // Buffer de 2 elementos abajo
    }
  }, [scrollTop, itemHeight, containerHeight, totalItems])

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement
    setScrollTop(target.scrollTop)
    
    // Detectar si necesitamos cargar más
    if (
      target.scrollTop + target.clientHeight >= 
      target.scrollHeight - threshold &&
      hasMore &&
      !isFetching
    ) {
      setIsFetching(true)
    }
  }, [hasMore, isFetching, threshold])

  useEffect(() => {
    if (!isFetching) return

    const fetchData = async () => {
      await fetchMore()
      setIsFetching(false)
    }

    fetchData()
  }, [isFetching, fetchMore])

  return { 
    visibleRange, 
    isFetching,
    handleScroll,
    totalHeight: totalItems * itemHeight
  }
}