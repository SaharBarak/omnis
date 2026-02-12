// Legacy doc components
export {
  DocH1,
  DocH2,
  DocH3,
  DocH4,
  DocParagraph,
  DocLead,
  DocBlockquote,
  DocList,
  DocCard,
  DocGrid,
  DocTable,
  DocBadge,
  DocDivider,
  DocNavigation,
  DocTableOfContents
} from './doc-content'

// InfoBox from doc-content (renamed to avoid conflict)
export { DocInfoBox as DocInfoBoxLegacy } from './doc-content'

// Sidebar components
export { DocSidebar, DocMobileNav } from './doc-sidebar'

// New editorial layout system
export {
  DocLayout,
  DocHeader,
  DocSection,
  DocNav,
  DocStats,
  DocInfoBox,
  DocPullQuote
} from './doc-layout'

// SEO components
export { QuickAnswer } from './QuickAnswer'
