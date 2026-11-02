export interface LabMedia {
  readonly label: string
  readonly webm: string
  readonly mp4: string
  readonly poster: string
}

/** The two looping murals the lab compositions stage, each with its painted still as poster. */
export const PORTAL_LOOP: LabMedia = {
  label: 'Portal',
  webm: '/videos/redesign/portal-loop.webm',
  mp4: '/videos/redesign/portal-loop.mp4',
  poster: '/images/redesign/mural/portal-cta.webp',
}

export const SKY_LOOP: LabMedia = {
  label: 'Night sky',
  webm: '/videos/redesign/hero-sky-loop.webm',
  mp4: '/videos/redesign/hero-sky-loop.mp4',
  poster: '/images/redesign/mural/hero-sky.webp',
}

export const LAB_MEDIA: readonly LabMedia[] = [PORTAL_LOOP, SKY_LOOP]

/** Product film for home section 2: real app screens, shotcraft method (BENTO_SITE.md). */
export const PRODUCT_FILM: LabMedia = {
  label: 'Pleiad, the app',
  webm: '/videos/redesign/product-film.webm',
  mp4: '/videos/redesign/product-film.mp4',
  poster: '/images/redesign/product-film-poster.webp',
}
