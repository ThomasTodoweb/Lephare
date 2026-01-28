import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

/**
 * Late API Profile response
 * Note: Late API returns _id, we normalize to id
 */
interface LateProfile {
  id: string
  _id?: string
  name: string
  createdAt?: string
}

/**
 * Late API Account response (normalized)
 */
interface LateAccount {
  id: string
  platform: string
  username: string
  profilePictureUrl?: string
  status: 'connected' | 'disconnected' | 'error'
  profileId?: string
}

/**
 * Late API raw account response
 */
interface LateRawAccount {
  _id: string
  id?: string
  platform: string
  username: string
  displayName?: string
  profilePicture?: string
  profilePictureUrl?: string
  isActive: boolean
  profileId: { _id: string; name: string }
  followersCount?: number
  followersLastUpdated?: string
  metadata?: {
    profileData?: {
      followersCount?: number
      mediaCount?: number
    }
  }
}

/**
 * Instagram content types supported
 */
export type InstagramContentType = 'post' | 'carousel' | 'reel' | 'story'

/**
 * Media item for Late API
 */
export interface MediaItem {
  type: 'image' | 'video'
  url: string
  thumbnail?: string // For video posts
}

/**
 * Platform-specific data for Instagram
 */
interface InstagramPlatformData {
  contentType?: 'feed' | 'story' | 'reels'
  shareToFeed?: boolean
  audioName?: string
  collaborators?: string[]
  trialParams?: {
    graduationStrategy: 'MANUAL' | 'SS_PERFORMANCE'
  }
}

/**
 * Media item with Instagram-specific thumbnail
 */
interface LateMediaItem {
  type: 'image' | 'video'
  url: string
  instagramThumbnail?: string // Custom cover image for reels
}

/**
 * Platform entry in the platforms array
 */
interface PlatformEntry {
  platform: string
  accountId: string
  platformSpecificData?: InstagramPlatformData
}

/**
 * Late API Post request - Full options
 * Based on: https://docs.getlate.dev/core/posts (updated format)
 */
interface CreatePostRequest {
  content?: string
  mediaItems: LateMediaItem[]
  platforms: PlatformEntry[]
  scheduledFor?: string // ISO 8601 format
  publishNow?: boolean // true = publish immediately
  timezone?: string // default: "UTC"
  isDraft?: boolean // true = save as draft
}

/**
 * Options for creating a post (external interface) - Simple version
 */
export interface CreatePostOptions {
  accountId: string
  content: string
  mediaUrl?: string
  hashtags?: string[]
  publishNow?: boolean // true = publish immediately, false = schedule
  scheduledFor?: Date // only used if publishNow is false
}

/**
 * Options for creating an Instagram post with full control
 */
export interface CreateInstagramPostOptions {
  accountId: string
  contentType: InstagramContentType
  content: string // Caption
  mediaItems: MediaItem[] // Images or video
  hashtags?: string[]
  mentions?: string[]
  publishNow?: boolean
  scheduledFor?: Date
  // Reel-specific options
  shareReelToFeed?: boolean
  coverImageUrl?: string // Thumbnail for reels
}

/**
 * Late API Post response
 */
interface LatePost {
  id: string
  status: 'scheduled' | 'published' | 'failed'
  scheduledFor?: string
  publishedAt?: string
  error?: string
}

/**
 * Late Analytics - Follower Stats response
 */
export interface FollowerStats {
  currentFollowers: number
  followerHistory: Array<{
    date: string
    count: number
  }>
  growth: {
    daily: number
    weekly: number
    monthly: number
  }
}

/**
 * Late Analytics - Post metrics response
 */
export interface PostMetrics {
  postId: string
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagementRate: number
  publishedAt: string
}

/**
 * Late Analytics - Account analytics summary
 */
export interface AccountAnalytics {
  accountId: string
  period: {
    start: string
    end: string
  }
  totals: {
    impressions: number
    reach: number
    likes: number
    comments: number
    shares: number
    saves: number
  }
  averageEngagementRate: number
  topPosts: PostMetrics[]
}

/**
 * LateService - Handles Late API for Instagram posting
 * Each user gets their own Late profile for isolation
 * Documentation: https://docs.getlate.dev
 */
export default class LateService {
  private apiKey: string
  private baseUrl: string = 'https://getlate.dev/api/v1'

  constructor() {
    this.apiKey = env.get('LATE_API_KEY', '')
  }

  /**
   * Check if Late API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Make authenticated request to Late API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data?: T; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      // Parse response body
      const data = await response.json() as T

      // Handle HTTP-level errors (400, 500, etc.)
      if (!response.ok) {
        const errorMsg = (data as unknown as { error?: string })?.error || `API error: ${response.status}`
        logger.error({ status: response.status, error: errorMsg, endpoint, data }, 'Late API HTTP error')
        return { error: errorMsg }
      }

      return { data }
    } catch (error) {
      logger.error({ error, endpoint }, 'Late API request failed')
      return { error: 'Erreur de connexion à Late API' }
    }
  }

  /**
   * List all profiles from Late API
   */
  async listProfiles(): Promise<LateProfile[]> {
    const result = await this.request<LateProfile[] | { profiles: LateProfile[] }>('/profiles')
    // Late API may return array directly or wrapped in { profiles: [...] }
    let rawProfiles = Array.isArray(result.data) ? result.data : (result.data?.profiles || [])
    // Normalize _id to id (Late API uses _id)
    const profiles = rawProfiles.map(p => ({
      ...p,
      id: p.id || p._id || ''
    }))
    logger.info({ count: profiles.length, profiles: profiles.map(p => ({ id: p.id, name: p.name })) }, 'Listed Late profiles')
    return profiles
  }

  /**
   * Find a profile by name
   */
  async findProfileByName(name: string): Promise<string | null> {
    const profiles = await this.listProfiles()
    logger.info({ searchingFor: name, availableProfiles: profiles.map(p => p.name) }, 'Searching for profile by name')
    const existing = profiles.find((p) => p.name === name)
    if (existing) {
      logger.info({ foundId: existing.id, name }, 'Found matching profile')
    } else {
      logger.warn({ name }, 'No matching profile found')
    }
    return existing?.id || null
  }

  /**
   * Create a new Late profile for a user
   * Each Le Phare user gets their own isolated profile
   * Late API returns: { message: 'Profile created successfully', profile: { _id: '...', name: '...' } }
   * Or error: { error: 'Profile limit reached...', planName: '...', limit: 10, current: 10 }
   */
  async createProfile(name: string): Promise<string | null> {
    const result = await this.request<{ message?: string; profile?: { _id: string; name: string }; error?: string; limit?: number; current?: number }>('/profiles', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })

    // Check for profile limit error (Late API returns 200 with error in body)
    if (result.data?.error) {
      logger.error({ error: result.data.error, limit: result.data.limit, current: result.data.current, name }, 'Late API profile creation error - plan limit reached')
      return null
    }

    // Handle HTTP-level errors
    if (result.error) {
      logger.error({ error: result.error, name }, 'Failed to create Late profile')
      return null
    }

    // Extract profile ID from nested response
    const profileId = result.data?.profile?._id
    if (!profileId) {
      logger.error({ data: result.data, name }, 'Late profile creation response missing profile._id')
      return null
    }

    logger.info({ profileId, name }, 'Created Late profile')
    return profileId
  }

  /**
   * Get or create a Late profile for a user
   */
  async getOrCreateProfile(userId: number, userEmail: string): Promise<string | null> {
    // Import User model here to avoid circular dependency
    const { default: User } = await import('#models/user')
    const user = await User.find(userId)

    if (!user) {
      logger.error({ userId }, 'User not found for getOrCreateProfile')
      return null
    }

    // If user already has a profile ID, return it
    if (user.lateProfileId) {
      logger.info({ userId, profileId: user.lateProfileId }, 'User already has Late profile')
      return user.lateProfileId
    }

    const profileName = `Le Phare - ${userEmail}`
    logger.info({ userId, profileName }, 'Creating/finding Late profile for user')

    // First, check if a profile with this name already exists
    let profileId = await this.findProfileByName(profileName)

    if (profileId) {
      logger.info({ profileId, name: profileName }, 'Found existing Late profile')
    } else {
      // Create a new profile for this user
      logger.info({ profileName }, 'Creating new Late profile')
      profileId = await this.createProfile(profileName)
      if (!profileId) {
        logger.error({ profileName }, 'Failed to create Late profile')
        return null
      }
    }

    // Save profile ID to user
    user.lateProfileId = profileId
    await user.save()
    logger.info({ userId, profileId }, 'Saved Late profile to user')

    return profileId
  }

  /**
   * Get connect URL for Instagram OAuth through Late
   * Creates a profile for the user if they don't have one
   * Returns { url, error } for better error handling
   */
  async getConnectUrl(userId: number, userEmail: string, callbackUrl: string): Promise<string | null> {
    // Get or create profile for this user
    const profileId = await this.getOrCreateProfile(userId, userEmail)
    if (!profileId) {
      logger.error({ userId, userEmail }, 'Failed to get/create Late profile for Instagram connect')
      return null
    }

    logger.info({ userId, profileId, callbackUrl }, 'Calling Late connect/instagram endpoint')

    // Call Late connect endpoint to get OAuth URL
    const params = new URLSearchParams({
      profileId,
      redirect_url: callbackUrl,
    })

    const result = await this.request<{ authUrl: string }>(`/connect/instagram?${params.toString()}`)

    if (result.error) {
      logger.error({ userId, profileId, error: result.error }, 'Late connect/instagram endpoint failed')
      return null
    }

    if (!result.data?.authUrl) {
      logger.error({ userId, profileId, data: result.data }, 'Late connect/instagram returned no authUrl')
      return null
    }

    logger.info({ userId, profileId, hasAuthUrl: !!result.data.authUrl }, 'Late connect URL obtained successfully')
    return result.data.authUrl
  }

  /**
   * List connected accounts for a specific profile
   */
  async listAccountsForProfile(profileId: string): Promise<LateAccount[]> {
    // Late API returns all accounts, we filter by profileId
    const result = await this.request<{ accounts: LateRawAccount[] }>('/accounts')
    if (!result.data?.accounts) {
      return []
    }
    // Filter accounts that belong to this profile
    return result.data.accounts
      .filter((a) => a.profileId?._id === profileId)
      .map((a) => ({
        id: a._id,
        platform: a.platform,
        username: a.username,
        profilePictureUrl: a.profilePicture,
        status: a.isActive ? 'connected' as const : 'disconnected' as const,
      }))
  }

  /**
   * Get Instagram account for a user's profile
   */
  async getInstagramAccountForUser(userId: number): Promise<LateAccount | null> {
    const { default: User } = await import('#models/user')
    const user = await User.find(userId)

    if (!user?.lateProfileId) {
      return null
    }

    const accounts = await this.listAccountsForProfile(user.lateProfileId)
    return accounts.find((a) => a.platform === 'instagram') || null
  }

  /**
   * Disconnect Instagram account from a user's profile
   */
  async disconnectInstagram(userId: number): Promise<boolean> {
    const account = await this.getInstagramAccountForUser(userId)
    if (!account) {
      return true // Already disconnected
    }

    const result = await this.request(`/accounts/${account.id}`, { method: 'DELETE' })
    if (result.error) {
      logger.error({ userId, accountId: account.id, error: result.error }, 'Failed to disconnect Instagram')
      return false
    }

    logger.info({ userId, accountId: account.id }, 'Disconnected Instagram account')
    return true
  }

  /**
   * Create a post on Instagram (simple version - backwards compatible)
   */
  async createPost(
    accountId: string,
    content: string,
    mediaUrl?: string,
    scheduledFor?: Date
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    return this.createPostWithOptions({
      accountId,
      content,
      mediaUrl,
      publishNow: !scheduledFor,
      scheduledFor,
    })
  }

  /**
   * Create a post on Instagram with full options
   */
  async createPostWithOptions(
    options: CreatePostOptions
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    if (!this.isConfigured()) {
      logger.warn('Late API not configured, simulating post')
      return { success: true, postId: `dev_${Date.now()}` }
    }

    // Build media items
    const mediaItems: LateMediaItem[] = []
    if (options.mediaUrl) {
      mediaItems.push({ type: 'image', url: options.mediaUrl })
    }

    const body: CreatePostRequest = {
      content: options.content,
      mediaItems,
      platforms: [
        {
          platform: 'instagram',
          accountId: options.accountId,
        },
      ],
      publishNow: options.publishNow ?? true,
    }

    if (options.scheduledFor && !options.publishNow) {
      body.scheduledFor = options.scheduledFor.toISOString()
      body.publishNow = false
    }

    logger.info({ accountId: options.accountId, publishNow: body.publishNow, hasMedia: !!options.mediaUrl }, 'Creating Instagram post via Late API')

    const result = await this.request<LatePost>('/posts', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (result.error) {
      logger.error({ error: result.error, accountId: options.accountId }, 'Failed to create post via Late')
      return { success: false, error: result.error }
    }

    logger.info({ postId: result.data?.id, status: result.data?.status }, 'Post created via Late API')
    return { success: true, postId: result.data?.id }
  }

  /**
   * Create an Instagram post with full control over content type
   * Supports: post (single image), carousel (multiple images), reel (video), story
   */
  async createInstagramPost(
    options: CreateInstagramPostOptions
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    if (!this.isConfigured()) {
      logger.warn('Late API not configured, simulating post')
      return { success: true, postId: `dev_${Date.now()}` }
    }

    // Build platform-specific data for Instagram
    const platformSpecificData: InstagramPlatformData = {}

    switch (options.contentType) {
      case 'story':
        platformSpecificData.contentType = 'story'
        break
      case 'reel':
        platformSpecificData.contentType = 'reels'
        if (options.shareReelToFeed !== undefined) {
          platformSpecificData.shareToFeed = options.shareReelToFeed
        }
        break
      case 'carousel':
      case 'post':
      default:
        // Feed is default, no need to specify for single image or carousel
        // Carousel is determined by number of mediaItems
        break
    }

    // Build media items with Instagram thumbnail support for reels
    const mediaItems: LateMediaItem[] = options.mediaItems.map((item) => {
      const lateItem: LateMediaItem = { type: item.type, url: item.url }
      // Add custom cover image for reels
      if (options.contentType === 'reel' && options.coverImageUrl) {
        lateItem.instagramThumbnail = options.coverImageUrl
      }
      return lateItem
    })

    // Build the request body with correct Late API format
    const body: CreatePostRequest = {
      content: options.content,
      mediaItems,
      platforms: [
        {
          platform: 'instagram',
          accountId: options.accountId,
          platformSpecificData:
            Object.keys(platformSpecificData).length > 0 ? platformSpecificData : undefined,
        },
      ],
      publishNow: options.publishNow ?? true,
    }

    // Handle scheduling
    if (options.scheduledFor && !options.publishNow) {
      body.scheduledFor = options.scheduledFor.toISOString()
      body.publishNow = false
    }

    logger.info(
      {
        accountId: options.accountId,
        contentType: options.contentType,
        publishNow: body.publishNow,
        mediaCount: options.mediaItems.length,
        body: JSON.stringify(body),
      },
      'Creating Instagram post via Late API'
    )

    const result = await this.request<LatePost>('/posts', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (result.error) {
      logger.error({ error: result.error, accountId: options.accountId, contentType: options.contentType }, 'Failed to create Instagram post via Late')
      return { success: false, error: result.error }
    }

    logger.info({ postId: result.data?.id, status: result.data?.status, contentType: options.contentType }, 'Instagram post created via Late API')
    return { success: true, postId: result.data?.id }
  }

  /**
   * Get post status
   */
  async getPostStatus(postId: string): Promise<LatePost | null> {
    const result = await this.request<LatePost>(`/posts/${postId}`)
    return result.data || null
  }

  /**
   * Delete a scheduled post
   */
  async deletePost(postId: string): Promise<boolean> {
    const result = await this.request(`/posts/${postId}`, { method: 'DELETE' })
    return !result.error
  }

  /**
   * Upload media to Late for posting
   */
  async uploadMedia(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<{ url?: string; error?: string }> {
    try {
      const formData = new FormData()
      const blob = new Blob([fileBuffer], { type: mimeType })
      formData.append('file', blob, filename)

      const response = await fetch(`${this.baseUrl}/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error({ status: response.status, error: errorText }, 'Late media upload failed')
        return { error: 'Échec de l\'upload du média' }
      }

      const data = await response.json() as { url: string }
      return { url: data.url }
    } catch (error) {
      logger.error({ error }, 'Late media upload error')
      return { error: 'Erreur lors de l\'upload' }
    }
  }

  // ============================================
  // ANALYTICS METHODS (Late Analytics Module)
  // ============================================

  /**
   * Get follower stats for an Instagram account
   * Gets follower count directly from the account object
   * (The /follower-stats endpoint doesn't exist in Late API)
   */
  async getFollowerStats(accountId: string): Promise<FollowerStats | null> {
    if (!this.isConfigured()) {
      logger.warn('Late API not configured')
      return null
    }

    // Get account data which includes follower count
    const result = await this.request<{ accounts: LateRawAccount[] }>('/accounts')

    if (result.error || !result.data?.accounts) {
      logger.error({ accountId, error: result.error }, 'Failed to get accounts for follower stats')
      return null
    }

    // Find the specific account
    const account = result.data.accounts.find((a) => a._id === accountId || a.id === accountId)
    if (!account) {
      logger.error({ accountId }, 'Account not found')
      return null
    }

    // Extract follower count from account direct property or metadata
    const currentFollowers = account.followersCount || account.metadata?.profileData?.followersCount || 0

    logger.info({ accountId, currentFollowers }, 'Retrieved follower count from account')

    // Late API doesn't provide historical follower data, so we return empty arrays
    // Growth would need to be calculated from our local instagram_stats table
    return {
      currentFollowers,
      followerHistory: [],
      growth: { daily: 0, weekly: 0, monthly: 0 },
    }
  }

  /**
   * Get analytics for posts
   * Uses Late Analytics API: GET /v1/analytics
   * Aggregates metrics from individual posts since overview doesn't include them
   * Note: Date filtering is not used as it seems to cause issues with the Late API
   */
  async getPostAnalytics(
    profileId: string,
    _startDate?: Date,
    _endDate?: Date
  ): Promise<AccountAnalytics | null> {
    if (!this.isConfigured()) {
      logger.warn('Late API not configured')
      return null
    }

    // Note: Date filtering (fromDate/toDate) and sortBy/order are intentionally not used
    // as they cause the Late API to return empty posts array
    const params = new URLSearchParams()
    params.append('platform', 'instagram')
    params.append('profileId', profileId)
    params.append('limit', '50')

    const result = await this.request<{
      overview: {
        totalPosts: number
        publishedPosts: number
        scheduledPosts: number
        lastSync: string
      }
      posts: Array<{
        _id: string
        postId?: string
        content: string
        publishedAt: string
        platformPostUrl: string
        isExternal: boolean
        analytics?: {
          impressions?: number
          reach?: number
          likes?: number
          comments?: number
          shares?: number
          saves?: number
          clicks?: number
          views?: number
          engagementRate?: number
        }
        platforms?: Array<{
          platform: string
          status: string
          analytics?: {
            impressions?: number
            reach?: number
            likes?: number
            comments?: number
            shares?: number
            saves?: number
            engagementRate?: number
          }
        }>
      }>
      accounts: Array<{
        _id: string
        platform: string
        username: string
        followerCount?: number
        followersLastUpdated?: string
      }>
      hasAnalyticsAccess: boolean
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(`/analytics?${params.toString()}`)

    if (result.error || !result.data) {
      logger.error({ profileId, error: result.error }, 'Failed to get post analytics')
      return null
    }

    const posts = result.data.posts || []

    // Aggregate metrics from individual posts since overview doesn't include engagement metrics
    const totals = {
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    }

    let totalEngagementRate = 0
    let postsWithEngagement = 0

    for (const post of posts) {
      // Try to get analytics from post.analytics or post.platforms[0].analytics
      const analytics = post.analytics || post.platforms?.[0]?.analytics || {}

      totals.impressions += analytics.impressions || 0
      totals.reach += analytics.reach || 0
      totals.likes += analytics.likes || 0
      totals.comments += analytics.comments || 0
      totals.shares += analytics.shares || 0
      totals.saves += analytics.saves || 0

      if (analytics.engagementRate) {
        totalEngagementRate += analytics.engagementRate
        postsWithEngagement++
      }
    }

    const averageEngagementRate = postsWithEngagement > 0 ? totalEngagementRate / postsWithEngagement : 0

    logger.info(
      { profileId, postsCount: posts.length, totals, hasAnalyticsAccess: result.data.hasAnalyticsAccess },
      'Aggregated Instagram analytics from posts'
    )

    return {
      accountId: profileId,
      period: {
        start: _startDate?.toISOString().split('T')[0] || '',
        end: _endDate?.toISOString().split('T')[0] || '',
      },
      totals,
      averageEngagementRate,
      topPosts: posts.slice(0, 5).map((p) => {
        const analytics = p.analytics || p.platforms?.[0]?.analytics || {}
        return {
          postId: p._id || p.postId || '',
          impressions: analytics.impressions || 0,
          reach: analytics.reach || 0,
          likes: analytics.likes || 0,
          comments: analytics.comments || 0,
          shares: analytics.shares || 0,
          saves: analytics.saves || 0,
          engagementRate: analytics.engagementRate || 0,
          publishedAt: p.publishedAt || '',
        }
      }),
    }
  }

  /**
   * Get Instagram analytics for a user
   * Combines follower stats and post analytics
   */
  async getInstagramAnalyticsForUser(
    userId: number,
    days: number = 30
  ): Promise<{
    followers: FollowerStats | null
    analytics: AccountAnalytics | null
  } | null> {
    // Get user's Late profile ID
    const { default: User } = await import('#models/user')
    const user = await User.find(userId)

    if (!user?.lateProfileId) {
      logger.info({ userId }, 'User has no Late profile')
      return null
    }

    // Get Instagram account for this user
    const account = await this.getInstagramAccountForUser(userId)
    if (!account) {
      logger.info({ userId }, 'No Instagram account connected')
      return null
    }

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch both in parallel
    const [followers, analytics] = await Promise.all([
      this.getFollowerStats(account.id),
      this.getPostAnalytics(user.lateProfileId, startDate, endDate),
    ])

    return { followers, analytics }
  }
}
