// frontend/src/pages/public/CategoriesPage.tsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Tag, ArrowRight } from 'lucide-react'
import { categoryApi } from '../../services/catalogApi'
import type { Category } from '../../types'
import { LoadingSpinner, EmptyState } from '../../components/common/Feedback'

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loadCategories = async () => {
      try {
        const res = await categoryApi.getCategories()
        if (isMounted) setCategories(res || [])
      } catch (err) {
        console.error('Failed to load categories', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadCategories()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading categories..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
          <Tag className="w-3.5 h-3.5" />
          Browse by Category
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Event Categories
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Filter experiences based on your passion—from rock concerts to developer summits.
        </p>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={Tag} title="No categories found" description="No event categories are configured." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c) => (
            <Link
              key={c.category_id}
              to={`/events?category_id=${c.category_id}`}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Tag className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300">
                  {c.category_name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {c.description || 'Explore upcoming events listed in this entertainment category.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-400">
                <span>Browse Category</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
