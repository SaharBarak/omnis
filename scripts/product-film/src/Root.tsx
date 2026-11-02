import { Composition } from 'remotion'
import { FPS, HEIGHT, ProductFilm, TOTAL, WIDTH } from './ProductFilm'

export const Root = () => (
  <Composition id="ProductFilm" component={ProductFilm} durationInFrames={TOTAL} fps={FPS} width={WIDTH} height={HEIGHT} />
)
