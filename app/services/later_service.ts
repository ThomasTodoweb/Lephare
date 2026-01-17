import env from '#start/env'
import { DateTime } from 'luxon'
import InstagramConnection from '#models/instagram_connection'
import logger from '@adonisjs/core/services/logger'

/**
 * Later API OAuth tokens response
 */
interface LaterTokens {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type: string
}

/**
 * Later API user info response
 */
interface LaterUserInfo {
  instagram_username: string
}

/**
 * LaterService - Handles Later API OAuth and Instagram integration
 */
export default class LaterService {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private baseUrl: string

  constructor() {
    this.clientId = env.get('LATER_CLIENT_ID', '')
    this.clientSecret = env.get('LATER_CLIENT_SECRET', '')
    this.redirectUri = env.get('LATER_REDIRECT_URI', '')
    this.baseUrl = env.get('LATER_API_URL', 'https://api.later.com')
  }

  /**
   * Check if Later API is configured
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.redirectUri)
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state,
      scope: 'read write publish',
    })

    return `${this.baseUrl}/oauth/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<LaterTokens | null> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          code,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error({ error, status: response.status }, 'Later OAuth token exchange failed')
        return null
      }

      return (await response.json()) as LaterTokens
    } catch (error) {
      logger.error({ error }, 'Later OAuth token exchange error')
      return null
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<LaterTokens | null> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error({ error, status: response.status }, 'Later token refresh failed')
        return null
      }

      return (await response.json()) as LaterTokens
    } catch (error) {
      logger.error({ error }, 'Later token refresh error')
      return null
    }
  }

  /**
   * Get Instagram username from Later API
   */
  async getInstagramUsername(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/user/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        logger.error({ status: response.status }, 'Later get user info failed')
        return null
      }

      const data = (await response.json()) as LaterUserInfo
      return data.instagram_username
    } catch (error) {
      logger.error({ error }, 'Later get user info error')
      return null
    }
  }

  /**
   * Store Instagram connection for a user
   */
  async storeConnection(
    userId: number,
    tokens: LaterTokens,
    instagramUsername: string
  ): Promise<InstagramConnection> {
    // Delete existing connection if any
    await InstagramConnection.query().where('user_id', userId).delete()

    // Calculate expiration date
    const expiresAt = tokens.expires_in
      ? DateTime.now().plus({ seconds: tokens.expires_in })
      : null

    // Create new connection with encrypted tokens
    const connection = await InstagramConnection.create({
      userId,
      laterAccessToken: tokens.access_token,
      laterRefreshToken: tokens.refresh_token || null,
      instagramUsername,
      connectedAt: DateTime.now(),
      expiresAt,
    })

    return connection
  }

  /**
   * Get a valid access token for a user, refreshing if necessary
   */
  async getValidAccessToken(userId: number): Promise<string | null> {
    const connection = await InstagramConnection.query().where('user_id', userId).first()

    if (!connection) {
      return null
    }

    // Check if token is expired
    if (connection.isExpired() && connection.laterRefreshToken) {
      const decryptedRefreshToken = connection.getDecryptedRefreshToken()
      if (decryptedRefreshToken) {
        const newTokens = await this.refreshAccessToken(decryptedRefreshToken)
        if (newTokens) {
          // Update connection with new tokens
          connection.laterAccessToken = newTokens.access_token
          if (newTokens.refresh_token) {
            connection.laterRefreshToken = newTokens.refresh_token
          }
          if (newTokens.expires_in) {
            connection.expiresAt = DateTime.now().plus({ seconds: newTokens.expires_in })
          }
          await connection.save()
          return newTokens.access_token
        }
      }
      return null
    }

    return connection.getDecryptedAccessToken()
  }

  /**
   * Delete Instagram connection for a user
   */
  async deleteConnection(userId: number): Promise<void> {
    await InstagramConnection.query().where('user_id', userId).delete()
  }

  /**
   * Check if user has a valid Instagram connection
   */
  async hasValidConnection(userId: number): Promise<boolean> {
    const token = await this.getValidAccessToken(userId)
    return token !== null
  }

  /**
   * Publish content to Instagram via Later
   * @returns post ID on success, null on failure
   */
  async publishToInstagram(
    userId: number,
    imageUrl: string,
    caption: string
  ): Promise<string | null> {
    const accessToken = await this.getValidAccessToken(userId)
    if (!accessToken) {
      logger.error({ userId }, 'No valid access token for publishing')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          publish_now: true,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error({ error, status: response.status, userId }, 'Later publish failed')
        return null
      }

      const data = (await response.json()) as { id: string }
      return data.id
    } catch (error) {
      logger.error({ error, userId }, 'Later publish error')
      return null
    }
  }
}
