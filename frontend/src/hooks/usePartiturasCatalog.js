import { useEffect, useState } from 'react'
import api from '../services/api'
import { racionais as staticRacionais, diversas as staticDiversas, R2_BASE_URL } from '../data/songs'

/**
 * Catálogo de partituras: tenta a API pública (Firestore) e cai no songs.js estático
 * enquanto o Firestore estiver vazio ou indisponível.
 */
export default function usePartiturasCatalog() {
  const [racionais, setRacionais] = useState(staticRacionais)
  const [diversas, setDiversas] = useState(staticDiversas)
  const [r2BaseUrl, setR2BaseUrl] = useState(R2_BASE_URL)
  const [source, setSource] = useState('static')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    api
      .get('/api/public/partituras')
      .then(({ data }) => {
        if (!mounted) return
        const nextRacionais = Array.isArray(data?.racionais) ? data.racionais : []
        const nextDiversas = Array.isArray(data?.diversas) ? data.diversas : []
        if (nextRacionais.length || nextDiversas.length) {
          setRacionais(nextRacionais)
          setDiversas(nextDiversas)
          setR2BaseUrl(data.r2BaseUrl || R2_BASE_URL)
          setSource(data.source || 'firestore')
        } else {
          setRacionais(staticRacionais)
          setDiversas(staticDiversas)
          setR2BaseUrl(R2_BASE_URL)
          setSource('static')
        }
      })
      .catch(() => {
        if (!mounted) return
        setRacionais(staticRacionais)
        setDiversas(staticDiversas)
        setR2BaseUrl(R2_BASE_URL)
        setSource('static')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return { racionais, diversas, r2BaseUrl, source, isLoading }
}
