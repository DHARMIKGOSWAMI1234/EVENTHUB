import React, { useState, useEffect } from 'react'
import { Tag, Plus, Edit, Trash2 } from 'lucide-react'
import { categoryApi } from '../../services/catalogApi'
import { adminApi } from '../../services/adminApi'
import { useToast } from '../../context/ToastContext'
import type { Category } from '../../types'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Textarea } from '../../components/common/Textarea'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { LoadingSpinner } from '../../components/common/Feedback'

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Form modal
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await categoryApi.getCategories()
      setCategories(data || [])
    } catch {
      toast('Failed to load categories', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleOpenCreate = () => {
    setEditingCategory(null)
    setName('')
    setDescription('')
    setShowModal(true)
  }

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c)
    setName(c.category_name || c.name || '')
    setDescription(c.description || '')
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast('Category name is required', 'warning')
      return
    }

    setSaving(true)
    try {
      if (editingCategory) {
        const catId = editingCategory.category_id ?? editingCategory.id
        await adminApi.updateCategory(catId, {
          category_name: name.trim(),
          description: description.trim() || undefined,
        })
        toast('Category updated successfully!', 'success')
      } else {
        await adminApi.createCategory({
          category_name: name.trim(),
          description: description.trim() || undefined,
        })
        toast('Category created successfully!', 'success')
      }
      setShowModal(false)
      loadCategories()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save category'
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    setDeleting(true)
    try {
      const delId = deletingCategory.category_id ?? deletingCategory.id
      await adminApi.deleteCategory(delId)
      toast('Category deleted successfully', 'info')
      setDeletingCategory(null)
      loadCategories()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('foreign key') || msg.includes('constraint') || msg.includes('409')) {
        toast('Cannot delete category: existing events are linked to this category in PostgreSQL.', 'error')
      } else {
        toast(msg || 'Failed to delete category', 'error')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Event Categories</h2>
          <p className="text-xs text-slate-400">
            Define classification taxonomies for public discovery and indexing.
          </p>
        </div>

        <Button type="button" variant="primary" size="sm" onClick={handleOpenCreate} className="bg-rose-600 hover:bg-rose-500">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <LoadingSpinner size="md" text="Loading categories..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div
              key={c.category_id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                      <Tag className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{c.category_name || c.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Edit Category"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCategory(c)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {c.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                Category ID #{c.category_id ?? c.id}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Category Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Comedy & Standup"
          />

          <Textarea
            label="Description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe events fitting this category..."
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={saving} className="bg-rose-600 hover:bg-rose-500">
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingCategory)}
        title="Delete Category?"
        message={`Are you sure you want to delete "${deletingCategory?.category_name}"? If existing events are associated, deletion will be blocked by foreign key integrity.`}
        confirmText="Yes, Delete Category"
        confirmVariant="danger"
        isLoading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeletingCategory(null)}
      />
    </div>
  )
}
