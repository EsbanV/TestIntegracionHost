import { useState, useEffect, useCallback } from 'react'

interface UseInfiniteScrollProps {
  fetchMore: () => Promise<void>
  hasMore: boolean
  threshold?: number
}

export const useInfiniteScroll = ({ 
  fetchMore, 
  hasMore, 
  threshold = 200 
}: UseInfiniteScrollProps) => {
  const [isFetching, setIsFetching] = useState(false)

  const handleScroll = useCallback(() => {
    if (!hasMore || isFetching) return

    const scrollTop = window.pageYOffset
    const windowHeight = window.innerHeight
    const docHeight = document.documentElement.offsetHeight

    console.log('📏 Scroll metrics:', { scrollTop, windowHeight, docHeight, threshold })

    if (scrollTop + windowHeight >= docHeight - threshold) {
      console.log('🚀 Scroll trigger activated!')
      setIsFetching(true)
    }
  }, [hasMore, isFetching, threshold])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    console.log('👂 Scroll listener attached')
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      console.log('👋 Scroll listener removed')
    }
  }, [handleScroll])

  useEffect(() => {
    if (!isFetching) return

    const doFetch = async () => {
      console.log('📦 Executing fetchMore...')
      try {
        await fetchMore()
      } catch (error) {
        console.error('❌ Error in fetchMore:', error)
      } finally {
        setIsFetching(false)
      }
    }

    doFetch()
  }, [isFetching, fetchMore])

  return { isFetching }
}