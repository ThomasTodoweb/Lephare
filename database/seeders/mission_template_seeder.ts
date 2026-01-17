import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Strategy from '#models/strategy'
import MissionTemplate from '#models/mission_template'

export default class extends BaseSeeder {
  async run() {
    // Get strategies by slug
    const ouverture = await Strategy.findBy('slug', 'ouverture')
    const notoriete = await Strategy.findBy('slug', 'notoriete')
    const debutant = await Strategy.findBy('slug', 'debutant')

    if (!ouverture || !notoriete || !debutant) {
      console.log('Please run Strategy seeder first')
      return
    }

    // Mission templates for "Ouverture de resto"
    await MissionTemplate.updateOrCreateMany('title', [
      {
        strategyId: ouverture.id,
        type: 'post',
        title: 'Les coulisses du chantier',
        contentIdea: 'Montrez l\'avancement des travaux de votre restaurant. Les gens adorent suivre une transformation !',
        order: 1,
        isActive: true,
      },
      {
        strategyId: ouverture.id,
        type: 'story',
        title: 'Teasing de votre carte',
        contentIdea: 'Présentez un plat signature que vous préparez pour l\'ouverture. Créez de l\'attente !',
        order: 2,
        isActive: true,
      },
      {
        strategyId: ouverture.id,
        type: 'post',
        title: 'Présentation de l\'équipe',
        contentIdea: 'Présentez-vous et votre équipe. Les clients aiment connaître les visages derrière le restaurant.',
        order: 3,
        isActive: true,
      },
      {
        strategyId: ouverture.id,
        type: 'reel',
        title: 'Countdown vers l\'ouverture',
        contentIdea: 'Créez un réel dynamique avec un compte à rebours vers votre grande ouverture !',
        order: 4,
        isActive: true,
      },
      {
        strategyId: ouverture.id,
        type: 'post',
        title: 'Annonce de la date d\'ouverture',
        contentIdea: 'Le grand jour approche ! Annoncez officiellement votre date d\'ouverture avec une belle photo de votre établissement.',
        order: 5,
        isActive: true,
      },
    ])

    // Mission templates for "Faire connaître"
    await MissionTemplate.updateOrCreateMany('title', [
      {
        strategyId: notoriete.id,
        type: 'post',
        title: 'Plat du jour en vedette',
        contentIdea: 'Mettez en valeur votre plat du jour avec une photo appétissante et sa description.',
        order: 1,
        isActive: true,
      },
      {
        strategyId: notoriete.id,
        type: 'story',
        title: 'Dans les coulisses de la cuisine',
        contentIdea: 'Montrez la préparation d\'un plat en cuisine. L\'authenticité attire !',
        order: 2,
        isActive: true,
      },
      {
        strategyId: notoriete.id,
        type: 'post',
        title: 'Avis client à partager',
        contentIdea: 'Partagez un avis positif d\'un client (avec sa permission) ou une photo de clients satisfaits.',
        order: 3,
        isActive: true,
      },
      {
        strategyId: notoriete.id,
        type: 'reel',
        title: 'Recette signature en vidéo',
        contentIdea: 'Montrez la préparation de votre plat signature en accéléré. Le format vidéo cartonne !',
        order: 4,
        isActive: true,
      },
      {
        strategyId: notoriete.id,
        type: 'story',
        title: 'Promotion spéciale',
        contentIdea: 'Annoncez une offre spéciale ou un menu découverte pour attirer de nouveaux clients.',
        order: 5,
        isActive: true,
      },
    ])

    // Mission templates for "Je débute sur les réseaux"
    await MissionTemplate.updateOrCreateMany('title', [
      {
        strategyId: debutant.id,
        type: 'tuto',
        title: 'Les bases de la photo culinaire',
        contentIdea: 'Apprenez les fondamentaux pour prendre de belles photos de vos plats.',
        order: 1,
        isActive: true,
      },
      {
        strategyId: debutant.id,
        type: 'post',
        title: 'Votre premier post',
        contentIdea: 'Publiez votre premier post ! Présentez votre restaurant et ce qui le rend unique.',
        order: 2,
        isActive: true,
      },
      {
        strategyId: debutant.id,
        type: 'tuto',
        title: 'Écrire une légende qui engage',
        contentIdea: 'Découvrez comment rédiger des descriptions qui donnent envie de commenter.',
        order: 3,
        isActive: true,
      },
      {
        strategyId: debutant.id,
        type: 'story',
        title: 'Votre première story',
        contentIdea: 'Créez votre première story ! Montrez l\'ambiance de votre restaurant aujourd\'hui.',
        order: 4,
        isActive: true,
      },
      {
        strategyId: debutant.id,
        type: 'tuto',
        title: 'Comprendre les hashtags',
        contentIdea: 'Apprenez à utiliser les hashtags pour être découvert par de nouveaux clients.',
        order: 5,
        isActive: true,
      },
    ])

    console.log('Mission templates seeded successfully!')
  }
}
