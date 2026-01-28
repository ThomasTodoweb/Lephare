import { Head, router } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { useState } from 'react'
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react'

interface ThematicCategory {
  id: number
  name: string
  slug: string
  icon: string | null
  isActive: boolean
  templatesCount: number
}

interface Props {
  categories: ThematicCategory[]
}

export default function CategoriesIndex({ categories }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ThematicCategory | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const handleToggle = async (id: number) => {
    try {
      await fetch(`/admin/categories/${id}/toggle`, { method: 'POST' })
      router.reload()
    } catch (error) {
      console.error('Error toggling category:', error)
    }
  }

  const handleDelete = async (id: number, templatesCount: number) => {
    if (templatesCount > 0) {
      alert(`Cette catégorie est utilisée par ${templatesCount} template(s). Supprimez d'abord les associations.`)
      return
    }
    if (!confirm('Supprimer cette catégorie ?')) return
    try {
      await fetch(`/admin/categories/${id}`, { method: 'DELETE' })
      router.reload()
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), icon: icon.trim() || null }),
      })
      if (res.ok) {
        setShowCreateModal(false)
        setName('')
        setIcon('')
        router.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur')
      }
    } catch (error) {
      console.error('Error creating category:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingCategory || !name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), icon: icon.trim() || null }),
      })
      if (res.ok) {
        setEditingCategory(null)
        setName('')
        setIcon('')
        router.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur')
      }
    } catch (error) {
      console.error('Error updating category:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSeedDefaults = async () => {
    if (!confirm('Ajouter les catégories par défaut ?')) return
    setSeeding(true)
    try {
      const res = await fetch('/admin/categories/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        router.reload()
      } else {
        alert(data.error || 'Erreur')
      }
    } catch (error) {
      console.error('Error seeding categories:', error)
    } finally {
      setSeeding(false)
    }
  }

  const openEdit = (cat: ThematicCategory) => {
    setEditingCategory(cat)
    setName(cat.name)
    setIcon(cat.icon || '')
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingCategory(null)
    setName('')
    setIcon('')
  }

  return (
    <AdminLayout>
      <Head title="Catégories thématiques - Admin" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Catégories thématiques</h1>
            <p className="text-gray-600 mt-1">
              Gérez les thématiques pour les missions et les idées
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {seeding ? 'Chargement...' : 'Ajouter par défaut'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle catégorie
            </button>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Templates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((cat) => (
                <tr key={cat.id} className={!cat.isActive ? 'opacity-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{cat.icon || '📁'}</span>
                      <span className="font-medium text-gray-900">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cat.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cat.templatesCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        cat.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleToggle(cat.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          cat.isActive
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={cat.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {cat.isActive ? (
                          <ToggleRight className="h-5 w-5" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.templatesCount)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Aucune catégorie. Cliquez sur "Ajouter par défaut" pour commencer.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCategory) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Plat du jour"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icône (emoji)
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="Ex: 🍽️"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={editingCategory ? handleUpdate : handleCreate}
                disabled={saving || !name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Enregistrement...' : editingCategory ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
