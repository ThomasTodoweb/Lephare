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
  router.get('/profile/instagram/reconnect', [ProfileController, 'reconnectInstagram']).as('profile.instagram.reconnect')
}).middleware(middleware.auth())
