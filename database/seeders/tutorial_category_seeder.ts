import { BaseSeeder } from '@adonisjs/lucid/seeders'
import TutorialCategory from '#models/tutorial_category'
import Tutorial from '#models/tutorial'

export default class extends BaseSeeder {
  async run() {
    // Create tutorial categories
    const categories = await TutorialCategory.updateOrCreateMany('slug', [
      {
        name: 'Posts',
        slug: 'post',
        description: 'Apprenez à créer des posts Instagram efficaces',
        order: 1,
        isActive: true,
      },
      {
        name: 'Stories',
        slug: 'story',
        description: 'Maîtrisez les stories Instagram pour engager votre audience',
        order: 2,
        isActive: true,
      },
      {
        name: 'Réels',
        slug: 'reel',
        description: 'Créez des réels captivants pour toucher plus de monde',
        order: 3,
        isActive: true,
      },
    ])

    // Get category IDs
    const postCategory = categories.find((c) => c.slug === 'post')!
    const storyCategory = categories.find((c) => c.slug === 'story')!
    const reelCategory = categories.find((c) => c.slug === 'reel')!

    // Create sample tutorials for Posts
    await Tutorial.updateOrCreateMany('title', [
      {
        categoryId: postCategory.id,
        title: 'Les bases d\'un bon post Instagram',
        description: 'Découvrez les éléments essentiels pour créer un post qui attire l\'attention',
        videoUrl: 'https://www.youtube.com/embed/example1',
        contentText: `
## Les éléments clés d'un bon post

### 1. La photo
Une photo de qualité est essentielle. Privilégiez la lumière naturelle et des angles originaux.

### 2. La légende
Racontez une histoire, posez des questions, invitez à l'interaction.

### 3. Les hashtags
Utilisez 5 à 15 hashtags pertinents pour augmenter votre visibilité.

### 4. Le timing
Publiez quand votre audience est active (généralement 12h-14h et 18h-21h).
        `,
        durationMinutes: 5,
        order: 1,
        isActive: true,
      },
      {
        categoryId: postCategory.id,
        title: 'Photographier vos plats comme un pro',
        description: 'Techniques simples pour sublimer vos créations culinaires',
        videoUrl: 'https://www.youtube.com/embed/example2',
        contentText: `
## Photo culinaire : les secrets

### La lumière
- Préférez la lumière naturelle près d'une fenêtre
- Évitez le flash direct qui écrase les textures

### L'angle
- 45° pour les plats avec du volume
- Vue du dessus (flat lay) pour les pizzas, tartes
- À hauteur d'assiette pour les burgers

### Le styling
- Nettoyez les bords de l'assiette
- Ajoutez des éléments de décor (herbes fraîches, ustensiles)
        `,
        durationMinutes: 7,
        order: 2,
        isActive: true,
      },
      {
        categoryId: postCategory.id,
        title: 'Écrire des légendes qui engagent',
        description: 'Comment rédiger des textes qui font réagir votre communauté',
        videoUrl: 'https://www.youtube.com/embed/example3',
        contentText: `
## L'art de la légende Instagram

### Structure gagnante
1. Un hook (accroche) percutant
2. L'histoire ou le message principal
3. Un call-to-action

### Exemples de hooks
- "La recette secrète que personne ne connaît..."
- "Vous ne devinerez jamais quel ingrédient..."
- "Ce plat a une histoire incroyable..."

### Call-to-action efficaces
- "Et vous, quel est votre plat préféré ?"
- "Tagguez quelqu'un qui adorerait ça !"
- "Dites-nous en commentaire !"
        `,
        durationMinutes: 6,
        order: 3,
        isActive: true,
      },
    ])

    // Create sample tutorials for Stories
    await Tutorial.updateOrCreateMany('title', [
      {
        categoryId: storyCategory.id,
        title: 'Stories Instagram : les fondamentaux',
        description: 'Tout ce qu\'il faut savoir pour créer des stories efficaces',
        videoUrl: 'https://www.youtube.com/embed/example4',
        contentText: `
## Les bases des Stories

### Pourquoi les stories ?
- Visibilité immédiate (en haut du feed)
- Format éphémère qui crée l'urgence
- Interaction directe avec l'audience

### Types de contenus
- Coulisses du restaurant
- Plat du jour
- Équipe en action
- Témoignages clients

### Durée optimale
- 15 secondes max par story
- 3 à 7 stories par séquence
        `,
        durationMinutes: 5,
        order: 1,
        isActive: true,
      },
      {
        categoryId: storyCategory.id,
        title: 'Utiliser les stickers interactifs',
        description: 'Sondages, questions, quiz : faites participer votre audience',
        videoUrl: 'https://www.youtube.com/embed/example5',
        contentText: `
## Les stickers qui engagent

### Sondage
- "Plutôt pizza ou burger ce soir ?"
- "Nouveau dessert : vanille ou chocolat ?"

### Questions
- "Quelle est votre question sur notre carte ?"
- "Un plat que vous aimeriez voir ?"

### Quiz
- "Combien d'œufs dans notre omelette signature ?"
- "Depuis combien de temps sommes-nous ouverts ?"

### Compte à rebours
- Pour les événements spéciaux
- Pour les nouveautés à venir
        `,
        durationMinutes: 6,
        order: 2,
        isActive: true,
      },
    ])

    // Create sample tutorials for Reels
    await Tutorial.updateOrCreateMany('title', [
      {
        categoryId: reelCategory.id,
        title: 'Créer votre premier Réel',
        description: 'Guide étape par étape pour réaliser un réel captivant',
        videoUrl: 'https://www.youtube.com/embed/example6',
        contentText: `
## Votre premier Réel

### Pourquoi les Réels ?
- Portée organique massive
- Découvrabilité accrue
- Format tendance

### Les étapes
1. Choisir une idée simple
2. Filmer plusieurs clips courts
3. Ajouter une musique tendance
4. Éditer avec les outils Instagram
5. Ajouter du texte si nécessaire

### Conseils
- Accrochez dès la première seconde
- Gardez un rythme dynamique
- Durée idéale : 15-30 secondes
        `,
        durationMinutes: 8,
        order: 1,
        isActive: true,
      },
      {
        categoryId: reelCategory.id,
        title: 'Idées de Réels pour restaurants',
        description: '10 formats de réels qui cartonnent dans la restauration',
        videoUrl: 'https://www.youtube.com/embed/example7',
        contentText: `
## 10 idées de Réels

### Cuisine
1. Préparation d'un plat en accéléré
2. L'avant/après d'une assiette
3. Technique de chef (flambage, découpe...)

### Ambiance
4. Visite du restaurant
5. Présentation de l'équipe
6. Montage d'une table

### Tendances
7. Participer aux trends du moment
8. Répondre aux commentaires en vidéo
9. POV "Quand vous commandez..."
10. "Ce que vous commandez vs ce que vous recevez"
        `,
        durationMinutes: 7,
        order: 2,
        isActive: true,
      },
    ])
  }
}
