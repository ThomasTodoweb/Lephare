import { useMemo } from 'react'

interface CaptionAnalyzerProps {
  caption: string
}

export function CaptionAnalyzer({ caption }: CaptionAnalyzerProps) {
  const analysis = useMemo(() => {
    const charCount = caption.length
    const hashtagCount = (caption.match(/#\w+/g) || []).length
    const hasQuestion = caption.includes('?')
    const hasEmoji = /\p{Emoji}/u.test(caption)
    const hasCTA = /clique|lien|bio|commande|réserve|découvr|venez|goûtez|testez/i.test(caption)

    const tips: string[] = []
    if (!hasQuestion && charCount > 20) tips.push('Pose une question pour engager')
    if (hashtagCount > 10) tips.push('Trop de hashtags (max 5-10)')
    if (hashtagCount === 0 && charCount > 20) tips.push('Ajoute 3-5 hashtags')
    if (!hasEmoji && charCount > 20) tips.push('Un emoji rend la caption plus humaine')
    if (charCount < 30 && charCount > 0) tips.push('Développe un peu ta caption')

    const score = Math.min(100,
      20 +
      (hasQuestion ? 15 : 0) +
      (hashtagCount >= 2 && hashtagCount <= 10 ? 20 : hashtagCount > 0 ? 10 : 0) +
      (hasEmoji ? 10 : 0) +
      (hasCTA ? 15 : 0) +
      (charCount >= 50 && charCount <= 800 ? 20 : charCount >= 30 ? 10 : 0)
    )

    return { charCount, hashtagCount, score, tips }
  }, [caption])

  if (caption.length < 5) return null

  const scoreColor = analysis.score >= 70 ? 'text-green-600' : analysis.score >= 40 ? 'text-amber-600' : 'text-red-500'
  const barColor = analysis.score >= 70 ? 'bg-green-500' : analysis.score >= 40 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${analysis.score}%` }} />
        </div>
        <span className={`text-[12px] font-bold ${scoreColor}`}>{analysis.score}/100</span>
      </div>

      <div className="flex gap-3 text-[11px] text-text-muted">
        <span>{analysis.charCount} car.</span>
        <span>{analysis.hashtagCount} #</span>
      </div>

      {analysis.tips.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-2.5">
          {analysis.tips.slice(0, 2).map((tip, i) => (
            <p key={i} className="text-[11px] text-amber-700">• {tip}</p>
          ))}
        </div>
      )}
    </div>
  )
}
