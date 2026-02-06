import { useState } from 'react'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'

interface MediaItem {
  type: 'image' | 'video'
  path: string
  order: number
}

interface InstagramPreviewProps {
  username: string | null
  profilePictureUrl: string | null
  mediaItems: MediaItem[]
  contentType: 'post' | 'carousel' | 'reel' | 'story'
  caption: string
  onCaptionClick?: () => void
}

function PostPreview({ username, profilePictureUrl, mediaItems, caption, onCaptionClick }: InstagramPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const isCarousel = mediaItems.length > 1
  const displayName = username || 'monrestaurant'

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-white p-[1px]">
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-neutral-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-neutral-500">{displayName[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
          <span className="text-sm font-semibold text-neutral-900">{displayName}</span>
        </div>
        <MoreHorizontal className="w-5 h-5 text-neutral-900" />
      </div>

      {/* Media */}
      <div className="relative bg-black aspect-square">
        {mediaItems[currentSlide]?.type === 'video' ? (
          <video
            src={`/${mediaItems[currentSlide].path}`}
            className="w-full h-full object-cover"
            controls={false}
            muted
            playsInline
          />
        ) : (
          <img
            src={`/${mediaItems[currentSlide]?.path}`}
            alt="Publication"
            className="w-full h-full object-cover"
          />
        )}

        {/* Carousel navigation */}
        {isCarousel && (
          <>
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide((c) => c - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-700" />
              </button>
            )}
            {currentSlide < mediaItems.length - 1 && (
              <button
                onClick={() => setCurrentSlide((c) => c + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow"
              >
                <ChevronRight className="w-4 h-4 text-neutral-700" />
              </button>
            )}
            {/* Counter badge */}
            <div className="absolute top-3 right-3 bg-black/60 text-white px-2.5 py-0.5 rounded-full text-xs font-medium">
              {currentSlide + 1}/{mediaItems.length}
            </div>
          </>
        )}
      </div>

      {/* Action bar */}
      <div className="px-3 pt-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 text-neutral-900" />
            <MessageCircle className="w-6 h-6 text-neutral-900 -scale-x-100" />
            <Send className="w-6 h-6 text-neutral-900" />
          </div>
          {/* Carousel dots */}
          {isCarousel ? (
            <div className="flex gap-1 absolute left-1/2 -translate-x-1/2">
              {mediaItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx === currentSlide ? 'bg-blue-500' : 'bg-neutral-300'
                  }`}
                />
              ))}
            </div>
          ) : null}
          <Bookmark className="w-6 h-6 text-neutral-900" />
        </div>

        {/* Caption */}
        <div
          className="pb-3 cursor-pointer"
          onClick={onCaptionClick}
        >
          {caption ? (
            <p className="text-sm text-neutral-900">
              <span className="font-semibold">{displayName}</span>{' '}
              <span className="whitespace-pre-wrap">{caption.length > 150 ? caption.slice(0, 150) + '...' : caption}</span>
              {caption.length > 150 && (
                <span className="text-neutral-400 ml-1">plus</span>
              )}
            </p>
          ) : (
            <p className="text-sm text-neutral-400 italic">Appuyez pour ajouter une description...</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ReelPreview({ username, profilePictureUrl, mediaItems, caption, onCaptionClick }: InstagramPreviewProps) {
  const displayName = username || 'monrestaurant'
  const media = mediaItems[0]

  return (
    <div className="bg-black rounded-xl overflow-hidden relative aspect-[9/16] max-h-[480px]">
      {/* Video/image background */}
      {media?.type === 'video' ? (
        <video
          src={`/${media.path}`}
          className="w-full h-full object-cover"
          controls={false}
          muted
          playsInline
        />
      ) : (
        <img
          src={`/${media?.path}`}
          alt="Reel"
          className="w-full h-full object-cover"
        />
      )}

      {/* Reels badge */}
      <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-semibold">
        Reels
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
        <div className="flex flex-col items-center gap-1">
          <Heart className="w-7 h-7 text-white drop-shadow" />
          <span className="text-white text-xs font-medium drop-shadow">0</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="w-7 h-7 text-white drop-shadow -scale-x-100" />
          <span className="text-white text-xs font-medium drop-shadow">0</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Send className="w-7 h-7 text-white drop-shadow" />
        </div>
      </div>

      {/* Bottom overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-12 cursor-pointer"
        onClick={onCaptionClick}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 p-[2px] flex-shrink-0">
            <div className="w-full h-full rounded-full bg-white p-[1px]">
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-neutral-700 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{displayName[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
          <span className="text-sm font-semibold text-white">{displayName}</span>
        </div>
        {caption ? (
          <p className="text-sm text-white/90 line-clamp-2">{caption}</p>
        ) : (
          <p className="text-sm text-white/50 italic">Appuyez pour ajouter une description...</p>
        )}
      </div>
    </div>
  )
}

export default function InstagramPreview(props: InstagramPreviewProps) {
  if (props.contentType === 'reel') {
    return <ReelPreview {...props} />
  }
  // Post and carousel use the same template (carousel has slider)
  return <PostPreview {...props} />
}
