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
}).middleware(middleware.auth())

// Placeholder route for Epic 3 (protected)
router
  .on('/onboarding/strategy')
  .renderInertia('home')
  .as('onboarding.strategy')
  .middleware(middleware.auth())
