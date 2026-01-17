/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')
const RestaurantsController = () => import('#controllers/restaurants_controller')
const DashboardController = () => import('#controllers/dashboard_controller')
const OnboardingController = () => import('#controllers/onboarding_controller')
const ProfileController = () => import('#controllers/profile_controller')
const LaterAuthController = () => import('#controllers/later_auth_controller')
const MissionsController = () => import('#controllers/missions_controller')
const PublicationsController = () => import('#controllers/publications_controller')
const TutorialsController = () => import('#controllers/tutorials_controller')

// Public landing page
router.on('/').renderInertia('home')

// Auth routes (guest only - redirect to dashboard if logged in)
router.group(() => {
  router.get('/register', [AuthController, 'showRegister']).as('register')
  router.post('/register', [AuthController, 'register'])
  router.get('/login', [AuthController, 'showLogin']).as('login')
  router.post('/login', [AuthController, 'login'])
}).middleware(middleware.guest())

// Logout route (auth required)
router.post('/logout', [AuthController, 'logout']).as('logout').middleware(middleware.auth())

// Protected routes (auth required)
router.group(() => {
  // Dashboard
  router.get('/dashboard', [DashboardController, 'index']).as('dashboard')

  // Restaurant setup
  router.get('/restaurant/type', [RestaurantsController, 'showTypeChoice']).as('restaurant.type')
  router.post('/restaurant/type', [RestaurantsController, 'storeType'])

  // Onboarding flow
  router.get('/onboarding/strategy', [OnboardingController, 'showStrategy']).as('onboarding.strategy')
  router.post('/onboarding/strategy', [OnboardingController, 'storeStrategy'])
  router.get('/onboarding/rhythm', [OnboardingController, 'showRhythm']).as('onboarding.rhythm')
  router.post('/onboarding/rhythm', [OnboardingController, 'storeRhythm'])
  router.get('/onboarding/instagram', [OnboardingController, 'showInstagram']).as('onboarding.instagram')
  router.post('/onboarding/instagram/skip', [OnboardingController, 'skipInstagram']).as('onboarding.instagram.skip')
  router.post('/onboarding/complete', [OnboardingController, 'complete']).as('onboarding.complete')

  // Profile
  router.get('/profile', [ProfileController, 'index']).as('profile')
  router.post('/profile/instagram/disconnect', [ProfileController, 'disconnectInstagram']).as('profile.instagram.disconnect')

  // Later OAuth (Instagram connection)
  router.get('/auth/later/redirect', [LaterAuthController, 'redirect']).as('later.redirect')
  router.get('/auth/later/callback', [LaterAuthController, 'callback']).as('later.callback')

  // Missions
  router.get('/missions', [MissionsController, 'today']).as('missions.today')
  router.post('/missions/:id/accept', [MissionsController, 'accept']).as('missions.accept')
  router.post('/missions/:id/skip', [MissionsController, 'skip']).as('missions.skip')
  router.post('/missions/:id/reload', [MissionsController, 'reload']).as('missions.reload')
  router.get('/missions/history', [MissionsController, 'history']).as('missions.history')

  // Publication flow
  router.get('/missions/:id/photo', [PublicationsController, 'photo']).as('missions.photo')
  router.post('/missions/:id/photo', [PublicationsController, 'uploadPhoto']).as('missions.photo.upload')
  router.get('/publications/:id/description', [PublicationsController, 'description']).as('publications.description')
  router.post('/publications/:id/caption', [PublicationsController, 'updateCaption']).as('publications.caption')
  router.post('/publications/:id/publish', [PublicationsController, 'publish']).as('publications.publish')
  router.get('/publications/:id/bravo', [PublicationsController, 'bravo']).as('publications.bravo')

  // Tutorials
  router.get('/tutorials', [TutorialsController, 'index']).as('tutorials.index')
  router.get('/tutorials/search', [TutorialsController, 'search']).as('tutorials.search')
  router.get('/tutorials/:id', [TutorialsController, 'show']).as('tutorials.show')
  router.post('/tutorials/:id/complete', [TutorialsController, 'complete']).as('tutorials.complete')
  router.post('/tutorials/:id/feedback', [TutorialsController, 'feedback']).as('tutorials.feedback')
  router.get('/tutorials/:id/bravo', [TutorialsController, 'bravo']).as('tutorials.bravo')
}).middleware(middleware.auth())
