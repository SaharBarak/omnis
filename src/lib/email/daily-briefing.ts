import { esc } from './layout'
import { COLORS } from '@/lib/design/landing-tokens'

import type { Briefing } from '@/lib/services/briefing/types'

/**
 * Renders the daily briefing into the inner `bodyHtml` fragment consumed by
 * renderEmail(). Email-safe throughout: tables + inline styles only, system
 * font stack, colours from the shared design tokens so it matches every other
 * Pleiad mail. Every dynamic value passes through esc().
 */

const MUTED = 'rgba(255,255,255,0.45)'
const FAINT = 'rgba(255,255,255,0.28)'
const LINE = 'rgba(255,255,255,0.08)'
const GOOD = '#5BD99A'
const WARN = '#E9C46A'
const BAD = '#E86A6A'

function sectionTitle(label: string): string {
  return `<div style="color:${COLORS.brandSoft};font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;margin:24px 0 12px;">${esc(label)}</div>`
}

function notConnected(reason: string): string {
  return `<p style="color:${FAINT};font-size:13px;margin:0 0 4px;font-style:italic;">${esc(reason)}</p>`
}

/** A row of big-number stats. */
function stats(items: Array<{ label: string; value: string; sub?: string; color?: string }>): string {
  const cells = items
    .map(
      (it) => `
      <td style="padding:0 8px;vertical-align:top;">
        <div style="color:${it.color ?? '#ffffff'};font-size:26px;font-weight:700;line-height:1.1;">${esc(it.value)}</div>
        <div style="color:${MUTED};font-size:12px;margin-top:4px;">${esc(it.label)}</div>
        ${it.sub ? `<div style="color:${FAINT};font-size:11px;margin-top:2px;">${esc(it.sub)}</div>` : ''}
      </td>`,
    )
    .join('')
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 4px;"><tr>${cells}</tr></table>`
}

/** A small ranked list ("top paths", "top queries"). */
function rankedList(rows: Array<{ label: string; value: string }>): string {
  if (rows.length === 0) return `<p style="color:${FAINT};font-size:12px;margin:4px 0;">no data</p>`
  const items = rows
    .map(
      (r) => `
      <tr>
        <td style="color:rgba(255,255,255,0.8);font-size:13px;padding:3px 0;">${esc(r.label)}</td>
        <td style="color:${MUTED};font-size:13px;padding:3px 0;text-align:right;white-space:nowrap;">${esc(r.value)}</td>
      </tr>`,
    )
    .join('')
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:6px 0;">${items}</table>`
}

function delta(current: number, prev: number): string {
  const d = current - prev
  if (d === 0) return 'flat vs prior day'
  const arrow = d > 0 ? '▲' : '▼'
  const color = d > 0 ? GOOD : BAD
  return `<span style="color:${color};">${arrow} ${Math.abs(d)}</span> vs prior day`
}

function gradeColor(score: number): string {
  if (score >= 80) return GOOD
  if (score >= 60) return WARN
  return BAD
}

function trafficBlock(s: Briefing['traffic']): string {
  if (!s.connected) return sectionTitle('Traffic & bots') + notConnected(s.reason)
  return (
    sectionTitle('Traffic & bots') +
    stats([
      { label: 'Human visits', value: s.humans.visits.toLocaleString(), sub: `${s.humans.uniques.toLocaleString()} unique` },
      { label: 'Human page views', value: s.humans.pageViews.toLocaleString() },
      { label: 'Bot / automated', value: `${s.botSharePct}%`, sub: `${s.botOrAutomated.toLocaleString()} of ${s.totalEdgeRequests.toLocaleString()} reqs`, color: s.botSharePct > 60 ? WARN : '#ffffff' },
    ]) +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:12px;"><tr>
      <td style="width:50%;vertical-align:top;padding-right:8px;">
        <div style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Top pages (humans)</div>
        ${rankedList(s.topPaths.map((p) => ({ label: p.label, value: p.count.toLocaleString() })))}
      </td>
      <td style="width:50%;vertical-align:top;padding-left:8px;">
        <div style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Top countries</div>
        ${rankedList(s.topCountries.map((c) => ({ label: c.label, value: c.count.toLocaleString() })))}
      </td>
    </tr></table>` +
    `<div style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:8px 0 2px;">Top referrers</div>` +
    rankedList(s.topReferrers.map((r) => ({ label: r.label, value: r.count.toLocaleString() })))
  )
}

function usersBlock(s: Briefing['users']): string {
  if (!s.connected) return sectionTitle('Users') + notConnected(s.reason)
  return (
    sectionTitle('Users') +
    stats([
      { label: 'New (24h)', value: s.new24h.toLocaleString(), sub: undefined, color: GOOD },
      { label: 'New (7d)', value: s.new7d.toLocaleString() },
      { label: 'Total users', value: s.total.toLocaleString() },
    ]) +
    stats([
      { label: 'People on maps', value: s.peopleTotal.toLocaleString(), sub: `${s.activeUsers} of ${s.total} users built a map` },
      { label: 'Pulled readings', value: `${s.usersWithReadings} of ${s.total}`, sub: 'users who checked signs' },
    ]) +
    `<p style="color:${MUTED};font-size:12px;margin:6px 0 0;">${delta(s.new24h, s.prev24h)}</p>`
  )
}

const PLAN_LABEL: Record<string, string> = {
  explorer: 'Explorer',
  complete: 'Complete',
  practitioner: 'Practitioner',
  lifetime: 'Lifetime',
}

function revenueBlock(s: Briefing['revenue']): string {
  if (!s.connected) return sectionTitle('Buyers & subscriptions') + notConnected(s.reason)
  const planRows = s.activePaidByPlan.map((p) => ({
    label: PLAN_LABEL[p.plan] ?? p.plan,
    value: p.count.toLocaleString(),
  }))
  return (
    sectionTitle('Buyers & subscriptions') +
    stats([
      { label: 'New paid (24h)', value: s.newPaid24h.toLocaleString(), color: GOOD },
      { label: 'Active paid', value: s.activePaidTotal.toLocaleString() },
      { label: 'Canceling', value: s.canceling.toLocaleString(), color: s.canceling > 0 ? WARN : '#ffffff' },
    ]) +
    `<div style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:10px 0 2px;">Active by plan</div>` +
    rankedList(planRows) +
    `<p style="color:${FAINT};font-size:11px;margin:4px 0 0;">Source: App Store / Play IAP (via subscriptions table).</p>`
  )
}

function seoBlock(on: Briefing['seoOnPage'], gsc: Briefing['gsc'], backlinks: Briefing['backlinks']): string {
  let html = sectionTitle('SEO')

  if (on.connected) {
    html += `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:8px;"><tr>
      <td style="vertical-align:middle;width:96px;">
        <div style="color:${gradeColor(on.score)};font-size:40px;font-weight:800;line-height:1;">${esc(on.grade)}</div>
        <div style="color:${MUTED};font-size:11px;margin-top:2px;">${on.score}/100 on-page</div>
      </td>
      <td style="vertical-align:middle;color:${MUTED};font-size:12px;">
        ${on.pagesChecked} pages checked ·
        robots.txt ${on.robotsOk ? `<span style="color:${GOOD};">ok</span>` : `<span style="color:${BAD};">missing</span>`} ·
        sitemap ${on.sitemapOk ? `<span style="color:${GOOD};">ok</span>` : `<span style="color:${BAD};">missing</span>`}
      </td>
    </tr></table>`
    if (on.issues.length) {
      html += `<div style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:6px 0 2px;">Fix next</div>`
      html += `<ul style="margin:4px 0 0;padding-left:18px;color:rgba(255,255,255,0.7);font-size:12px;">${on.issues
        .map((i) => `<li style="margin:2px 0;">${esc(i)}</li>`)
        .join('')}</ul>`
    }
  } else {
    html += notConnected(on.reason)
  }

  html += `<div style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:14px 0 4px;">Search (Google Search Console)</div>`
  if (gsc.connected) {
    html +=
      stats([
        { label: `Clicks (${gsc.day})`, value: gsc.clicks.toLocaleString() },
        { label: 'Impressions', value: gsc.impressions.toLocaleString() },
        { label: 'CTR', value: `${gsc.ctrPct}%` },
        { label: 'Avg position', value: `${gsc.avgPosition}` },
      ]) +
      `<div style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:8px 0 2px;">Top queries</div>` +
      rankedList(gsc.topQueries.map((q) => ({ label: q.query, value: `${q.clicks} clk · pos ${q.position}` })))
  } else {
    html += notConnected(gsc.reason)
  }

  html += `<div style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:14px 0 4px;">Backlinks</div>`
  html += backlinks.connected
    ? stats([
        { label: 'Backlinks', value: backlinks.totalBacklinks.toLocaleString() },
        { label: 'Ref. domains', value: backlinks.referringDomains.toLocaleString() },
        { label: 'Domain rating', value: backlinks.domainRating != null ? `${backlinks.domainRating}` : '—' },
      ])
    : notConnected(backlinks.reason)

  return html
}

export interface RenderedBriefing {
  subject: string
  preheader: string
  bodyHtml: string
  footerText: string
}

export function renderBriefingEmail(b: Briefing): RenderedBriefing {
  const date = b.generatedAt.slice(0, 10)
  const humans = b.traffic.connected ? b.traffic.humans.visits : null
  const newUsers = b.users.connected ? b.users.new24h : null
  const newPaid = b.revenue.connected ? b.revenue.newPaid24h : null

  const preheaderParts = [
    humans != null ? `${humans} human visits` : null,
    newUsers != null ? `${newUsers} new users` : null,
    newPaid != null ? `${newPaid} new paid` : null,
  ].filter(Boolean)

  const bodyHtml =
    `<p style="color:${MUTED};font-size:13px;margin:0 0 4px;">Daily briefing · ${esc(b.windowLabel)} · ${esc(new URL(b.siteUrl).hostname)}</p>` +
    trafficBlock(b.traffic) +
    usersBlock(b.users) +
    revenueBlock(b.revenue) +
    seoBlock(b.seoOnPage, b.gsc, b.backlinks) +
    `<hr style="border:none;border-top:1px solid ${LINE};margin:24px 0 0;">`

  return {
    subject: `Pleiad daily · ${date}${preheaderParts.length ? ` — ${preheaderParts.join(', ')}` : ''}`,
    preheader: preheaderParts.join(' · ') || 'Your Pleiad daily briefing',
    bodyHtml,
    footerText: `Generated ${esc(b.generatedAt)} · Pleiad ops briefing.`,
  }
}
