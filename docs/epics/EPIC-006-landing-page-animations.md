# EPIC-006: Landing Page Animations

**Status:** Proposed
**Created:** 2026-02-05
**Author:** Arc (Product Engineer)
**Phase:** P3.4 (Future Enhancement)
**Priority:** Low

---

## Problem Statement

The landing page exists but is marked PARTIAL in LANDING_PAGE.md. The basic structure is in place, but the immersive, conversion-focused experience defined in the spec is missing:

- No animated starfield background
- No constellation connection animations
- No parallax scroll effects
- No hyper-personalization messaging
- Static hero section instead of dynamic
- Missing the "wow factor" that converts visitors

The landing page is the first impression for potential users. A static page doesn't communicate the depth and magic of what Omnis offers.

## Proposed Solution

Implement the full landing page vision from LANDING_PAGE.md:

### Hero Section
- Animated starfield canvas (WebGL/Three.js or CSS)
- Constellation lines connecting stars on hover/scroll
- Floating system symbols (seals, zodiac signs)
- Animated headline reveal
- "Calculate Your Blueprint" CTA with particle effect

### Scroll Experience
- Parallax layers (foreground/background)
- Section reveals on scroll
- Smooth scroll between sections
- Progress indicator

### Feature Sections
- System showcase with animated cards
- Interactive preview widgets
- Testimonial carousel with subtle animation
- Pricing table with hover effects

### Personalization
- Birth date quick input in hero
- Instant mini-result preview
- "Sign up to see full reading" conversion flow

### Performance
- Lazy load animations
- Reduced motion media query support
- Mobile-optimized (simpler animations)
- Target: Lighthouse performance > 90

## Affected Components

| Component | Changes |
|-----------|---------|
| `src/app/page.tsx` | Major update - Full landing page rebuild |
| `src/components/landing/` | New - Hero, Starfield, Features, Testimonials |
| `src/components/landing/Starfield.tsx` | New - Animated star canvas |
| `src/components/landing/Constellation.tsx` | New - Interactive connections |
| `src/components/landing/ParallaxSection.tsx` | New - Scroll-driven parallax |
| `src/components/landing/QuickCalculator.tsx` | New - Hero mini-form |
| `src/lib/hooks/use-scroll-animation.ts` | New - Intersection observer hook |

## Success Criteria

- [ ] Animated starfield renders smoothly (60fps)
- [ ] Constellation lines animate on scroll/interaction
- [ ] Hero text animates on load
- [ ] Parallax effect on scroll (at least 2 layers)
- [ ] Quick birth date input with instant preview
- [ ] Feature sections reveal on scroll
- [ ] Mobile version has optimized (lighter) animations
- [ ] Reduced motion preference respected
- [ ] Lighthouse performance > 90
- [ ] Lighthouse accessibility > 90
- [ ] Time to interactive < 3s
- [ ] Conversion tracking in place

## Tasks (Post-Approval)

1. Design animation storyboard
2. Research animation libraries (Framer Motion vs GSAP vs Three.js)
3. Build Starfield component
4. Build Constellation interaction component
5. Create parallax scroll system
6. Implement hero section with animations
7. Build quick calculator widget
8. Create feature section reveals
9. Add testimonial carousel
10. Implement pricing section
11. Optimize for mobile
12. Add reduced motion support
13. Performance optimization pass
14. A/B test setup for conversion

## Technical Approach

### Starfield Options
1. **CSS Only**: Simple, performant, limited interactivity
2. **Canvas 2D**: Good balance of performance and features
3. **Three.js/WebGL**: Most impressive, highest complexity
4. **Framer Motion**: Great for React, good DX

**Recommendation:** Canvas 2D for starfield, Framer Motion for UI animations

### Performance Budget
- Total JS for landing: < 100KB gzipped
- Animation loop: < 16ms per frame
- First paint: < 1.5s
- Interactive: < 3s

## Estimated Effort

- **Design/Planning:** 1 week
- **Starfield/Canvas:** 1 week
- **Scroll Animations:** 1 week
- **Content Sections:** 1 week
- **Performance/Polish:** 1 week
- **Total:** 5 weeks

## References

- `/specs/LANDING_PAGE.md` - Full specification
- Framer Motion docs
- Awwwards inspiration
