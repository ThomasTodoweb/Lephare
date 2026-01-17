import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Badge from '#models/badge'

export default class extends BaseSeeder {
  async run() {
    await Badge.updateOrCreateMany('slug', [
      // Mission-based badges (cuisine hierarchy)
      {
        name: 'Commis',
        slug: 'commis',
        description: 'Complète 5 missions',
        icon: '👨‍🍳',
        criteriaType: 'missions_completed',
        criteriaValue: 5,
        order: 1,
        isActive: true,
      },
      {
        name: 'Sous-chef',
        slug: 'sous-chef',
        description: 'Complète 20 missions',
        icon: '🍳',
        criteriaType: 'missions_completed',
        criteriaValue: 20,
        order: 2,
        isActive: true,
      },
      {
        name: 'Chef',
        slug: 'chef',
        description: 'Complète 50 missions',
        icon: '👨‍🍳',
        criteriaType: 'missions_completed',
        criteriaValue: 50,
        order: 3,
        isActive: true,
      },
      {
        name: 'Chef Étoilé',
        slug: 'chef-etoile',
        description: 'Complète 100 missions',
        icon: '⭐',
        criteriaType: 'missions_completed',
        criteriaValue: 100,
        order: 4,
        isActive: true,
      },

      // Streak-based badges
      {
        name: 'Régulier',
        slug: 'regulier',
        description: 'Maintiens un streak de 7 jours',
        icon: '🔥',
        criteriaType: 'streak_days',
        criteriaValue: 7,
        order: 5,
        isActive: true,
      },
      {
        name: 'Assidu',
        slug: 'assidu',
        description: 'Maintiens un streak de 14 jours',
        icon: '💪',
        criteriaType: 'streak_days',
        criteriaValue: 14,
        order: 6,
        isActive: true,
      },
      {
        name: 'Machine',
        slug: 'machine',
        description: 'Maintiens un streak de 30 jours',
        icon: '🚀',
        criteriaType: 'streak_days',
        criteriaValue: 30,
        order: 7,
        isActive: true,
      },

      // Tutorial-based badges
      {
        name: 'Curieux',
        slug: 'curieux',
        description: 'Regarde 3 tutoriels',
        icon: '📚',
        criteriaType: 'tutorials_viewed',
        criteriaValue: 3,
        order: 8,
        isActive: true,
      },
      {
        name: 'Apprenti',
        slug: 'apprenti',
        description: 'Regarde 10 tutoriels',
        icon: '🎓',
        criteriaType: 'tutorials_viewed',
        criteriaValue: 10,
        order: 9,
        isActive: true,
      },
      {
        name: 'Expert',
        slug: 'expert',
        description: 'Regarde tous les tutoriels',
        icon: '🏆',
        criteriaType: 'tutorials_viewed',
        criteriaValue: 20,
        order: 10,
        isActive: true,
      },
    ])
  }
}
