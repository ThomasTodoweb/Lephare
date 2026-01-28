import { BaseSeeder } from '@adonisjs/lucid/seeders'
import LevelThreshold from '#models/level_threshold'
import XpAction from '#models/xp_action'

export default class extends BaseSeeder {
  async run() {
    // Seed level thresholds
    const levels = [
      { level: 1, xpRequired: 0, name: 'Débutant', icon: '🌱' },
      { level: 2, xpRequired: 50, name: 'Apprenti', icon: '🌿' },
      { level: 3, xpRequired: 150, name: 'Curieux', icon: '🌲' },
      { level: 4, xpRequired: 300, name: 'Motivé', icon: '🌳' },
      { level: 5, xpRequired: 500, name: 'Régulier', icon: '⭐' },
      { level: 6, xpRequired: 750, name: 'Engagé', icon: '🌟' },
      { level: 7, xpRequired: 1000, name: 'Expert', icon: '💫' },
      { level: 8, xpRequired: 1500, name: 'Maître', icon: '🏆' },
      { level: 9, xpRequired: 2000, name: 'Légende', icon: '👑' },
      { level: 10, xpRequired: 3000, name: 'Le Phare', icon: '🔥' },
    ]

    for (const level of levels) {
      await LevelThreshold.updateOrCreate(
        { level: level.level },
        level
      )
    }

    // Seed XP actions
    const actions = [
      { actionType: 'mission_completed', xpAmount: 10, description: 'Mission quotidienne complétée' },
      { actionType: 'tutorial_completed', xpAmount: 5, description: 'Tutoriel terminé' },
      { actionType: 'streak_day', xpAmount: 2, description: 'Jour de streak consécutif' },
      { actionType: 'first_mission', xpAmount: 20, description: 'Première mission complétée' },
      { actionType: 'first_tutorial', xpAmount: 10, description: 'Premier tutoriel terminé' },
      { actionType: 'weekly_streak', xpAmount: 15, description: '7 jours de streak' },
      { actionType: 'badge_earned', xpAmount: 25, description: 'Badge débloqué' },
    ]

    for (const action of actions) {
      await XpAction.updateOrCreate(
        { actionType: action.actionType as any },
        { ...action, actionType: action.actionType as any, isActive: true }
      )
    }
  }
}
