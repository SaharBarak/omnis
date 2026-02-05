# BUG-001: Email Unsubscribe Link Uses Hardcoded Placeholder

**Severity:** 🔴 Critical  
**Component:** Daily Kin Cron / Email Newsletter  
**Status:** ✅ Fixed (commit 7d4d896)  
**Found:** 2026-02-05  
**Reporter:** QA Agent  

---

## Summary

The daily kin email unsubscribe link contains a hardcoded placeholder `RECIPIENT` instead of the actual subscriber email address. This means **no subscriber can unsubscribe** via the email link.

## Reproduction

1. Subscribe to the Daily Kin newsletter
2. Receive a daily kin email
3. Click "Unsubscribe" link at bottom
4. Link goes to: `https://omnis.app/api/newsletter/unsubscribe?email=RECIPIENT`
5. Unsubscribe fails silently (no email matching "RECIPIENT" exists)

## Root Cause

In `src/app/api/cron/daily-kin/route.ts`, line 253:

```html
<a href="https://omnis.app/api/newsletter/unsubscribe?email=RECIPIENT" style="color: #888;">Unsubscribe</a>
```

The `RECIPIENT` placeholder is never replaced with `subscriber.email` in the email loop.

## Expected Behavior

The unsubscribe link should contain the actual subscriber's email:
```html
<a href="https://omnis.app/api/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}" style="color: #888;">Unsubscribe</a>
```

## Impact

- **Legal/Compliance:** CAN-SPAM and GDPR require functional unsubscribe links
- **User Experience:** Users cannot opt-out of emails
- **Reputation:** Could lead to spam complaints and email deliverability issues

## Fix

1. Pass subscriber email to the `getDailyKinEmailHtml` function
2. Replace `RECIPIENT` with the actual email in the template
3. URL-encode the email for the query parameter

## Files Affected

- `src/app/api/cron/daily-kin/route.ts`

## Related Tests

- `src/app/api/cron/daily-kin/daily-kin.test.ts` - should add test for unsubscribe link
