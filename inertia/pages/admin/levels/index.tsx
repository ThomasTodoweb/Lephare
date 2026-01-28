import { Head, Link, useForm } from '@inertiajs/react'
import { useState } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, Save, X } from 'lucide-react'

interface Level {
  id: number
  level: number
  xpRequired: number
  name: string | null
  icon: string | null
}

interface XpAction {
  id: number
  actionType: string
  xpAmount: number
  description: string | null
  isActive: boolean
}

interface Props {
  levels: Level[]
  xpActions: XpAction[]
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  mission_completed: 'Mission complétée',
  tutorial_completed: 'Tutoriel terminé',
  streak_day: 'Jour de streak',
  first_mission: 'Première mission',
  first_tutorial: 'Premier tutoriel',
  weekly_streak: 'Semaine de streak (7 jours)',
  badge_earned: 'Badge débloqué',
}

export default function AdminLevelsIndex({ levels, xpActions }: Props) {
  const [editingLevel, setEditingLevel] = useState<number | null>(null)
  const [editingAction, setEditingAction] = useState<number | null>(null)
  const [showNewLevelForm, setShowNewLevelForm] = useState(false)

  const levelForm = useForm({
    level: 0,
    xpRequired: 0,
    name: '',
    icon: '',
  })

  const actionForm = useForm({
    xpAmount: 0,
    description: '',
    isActive: true,
  })

  const newLevelForm = useForm({
    level: levels.length + 1,
    xpRequired: 0,
    name: '',
    icon: '',
  })

  const handleEditLevel = (level: Level) => {
    setEditingLevel(level.id)
    levelForm.setData({
      level: level.level,
      xpRequired: level.xpRequired,
      name: level.name || '',
      icon: level.icon || '',
    })
  }

  const handleSaveLevel = (id: number) => {
    levelForm.put(`/admin/levels/${id}`, {
      onSuccess: () => setEditingLevel(null),
    })
  }

  const handleDeleteLevel = (id: number) => {
    if (confirm('Supprimer ce niveau ?')) {
      levelForm.delete(`/admin/levels/${id}`)
    }
  }

  const handleCreateLevel = () => {
    newLevelForm.post('/admin/levels', {
      onSuccess: () => {
        setShowNewLevelForm(false)
        newLevelForm.reset()
      },
    })
  }

  const handleEditAction = (action: XpAction) => {
    setEditingAction(action.id)
    actionForm.setData({
      xpAmount: action.xpAmount,
      description: action.description || '',
      isActive: action.isActive,
    })
  }

  const handleSaveAction = (id: number) => {
    actionForm.put(`/admin/xp-actions/${id}`, {
      onSuccess: () => setEditingAction(null),
    })
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Head title="Niveaux & XP - Admin" />

      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-neutral-500 hover:text-neutral-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Niveaux & XP</h1>
            <p className="text-sm text-neutral-500">Gérer la progression des utilisateurs</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Levels Section */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <h2 className="text-lg font-bold text-neutral-900">Seuils de Niveaux</h2>
            <button
              onClick={() => setShowNewLevelForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Nouveau
            </button>
          </div>

          {/* New Level Form */}
          {showNewLevelForm && (
            <div className="p-4 bg-neutral-50 border-b border-neutral-100">
              <div className="flex items-end gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Niveau</label>
                  <input
                    type="number"
                    value={newLevelForm.data.level}
                    onChange={(e) => newLevelForm.setData('level', Number(e.target.value))}
                    className="w-20 px-2 py-1.5 border border-neutral-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">XP requis</label>
                  <input
                    type="number"
                    value={newLevelForm.data.xpRequired}
                    onChange={(e) => newLevelForm.setData('xpRequired', Number(e.target.value))}
                    className="w-24 px-2 py-1.5 border border-neutral-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Nom</label>
                  <input
                    type="text"
                    value={newLevelForm.data.name}
                    onChange={(e) => newLevelForm.setData('name', e.target.value)}
                    placeholder="Ex: Débutant"
                    className="w-32 px-2 py-1.5 border border-neutral-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Icône</label>
                  <input
                    type="text"
                    value={newLevelForm.data.icon}
                    onChange={(e) => newLevelForm.setData('icon', e.target.value)}
                    placeholder="🌱"
                    className="w-16 px-2 py-1.5 border border-neutral-300 rounded text-sm text-center"
                  />
                </div>
                <button
                  onClick={handleCreateLevel}
                  disabled={newLevelForm.processing}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                >
                  Créer
                </button>
                <button
                  onClick={() => setShowNewLevelForm(false)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-neutral-100">
            {levels.map((level) => (
              <div key={level.id} className="p-4 flex items-center gap-4">
                {editingLevel === level.id ? (
                  <>
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="number"
                        value={levelForm.data.level}
                        onChange={(e) => levelForm.setData('level', Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-neutral-300 rounded text-sm"
                        disabled
                      />
                      <input
                        type="number"
                        value={levelForm.data.xpRequired}
                        onChange={(e) => levelForm.setData('xpRequired', Number(e.target.value))}
                        className="w-24 px-2 py-1 border border-neutral-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={levelForm.data.name}
                        onChange={(e) => levelForm.setData('name', e.target.value)}
                        className="w-32 px-2 py-1 border border-neutral-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={levelForm.data.icon}
                        onChange={(e) => levelForm.setData('icon', e.target.value)}
                        className="w-12 px-2 py-1 border border-neutral-300 rounded text-sm text-center"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveLevel(level.id)}
                        disabled={levelForm.processing}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingLevel(null)}
                        className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-2xl w-10">{level.icon || '⭐'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">
                        Niveau {level.level}: {level.name || `Niveau ${level.level}`}
                      </p>
                      <p className="text-sm text-neutral-500">{level.xpRequired} XP requis</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditLevel(level)}
                        className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {level.level > 1 && (
                        <button
                          onClick={() => handleDeleteLevel(level.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* XP Actions Section */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="p-4 border-b border-neutral-100">
            <h2 className="text-lg font-bold text-neutral-900">Actions XP</h2>
            <p className="text-sm text-neutral-500 mt-1">XP gagnés par action</p>
          </div>

          <div className="divide-y divide-neutral-100">
            {xpActions.map((action) => (
              <div key={action.id} className="p-4 flex items-center gap-4">
                {editingAction === action.id ? (
                  <>
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-sm font-medium text-neutral-700 w-40">
                        {ACTION_TYPE_LABELS[action.actionType] || action.actionType}
                      </span>
                      <input
                        type="number"
                        value={actionForm.data.xpAmount}
                        onChange={(e) => actionForm.setData('xpAmount', Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-neutral-300 rounded text-sm"
                      />
                      <span className="text-sm text-neutral-500">XP</span>
                      <input
                        type="text"
                        value={actionForm.data.description}
                        onChange={(e) => actionForm.setData('description', e.target.value)}
                        placeholder="Description"
                        className="flex-1 px-2 py-1 border border-neutral-300 rounded text-sm"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={actionForm.data.isActive}
                          onChange={(e) => actionForm.setData('isActive', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Actif</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveAction(action.id)}
                        disabled={actionForm.processing}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingAction(null)}
                        className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-neutral-900">
                          {ACTION_TYPE_LABELS[action.actionType] || action.actionType}
                        </span>
                        {!action.isActive && (
                          <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded">
                            Désactivé
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500">
                        {action.description || 'Pas de description'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary">+{action.xpAmount} XP</span>
                      <button
                        onClick={() => handleEditAction(action)}
                        className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
