export const BADGE_COLORS = ["blue", "green", "red", "purple", "yellow", "pink", "cyan"] as const

export type BadgeColor = (typeof BADGE_COLORS)[number]

export const getBadgeColor = (index: number): BadgeColor => {
  return BADGE_COLORS[index % BADGE_COLORS.length]
}
