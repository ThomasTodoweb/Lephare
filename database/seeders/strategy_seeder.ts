import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Strategy, { STRATEGIES } from '#models/strategy'

export default class extends BaseSeeder {
  async run() {
    for (const strategyData of STRATEGIES) {
      await Strategy.updateOrCreate({ slug: strategyData.slug }, strategyData)
    }
  }
}