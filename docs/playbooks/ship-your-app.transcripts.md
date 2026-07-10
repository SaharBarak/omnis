

## Reel 1 — DaSpPVGsu-o
lang=en dur=53s

**Caption:**
Follow these 3 steps after buying your app domain.

Basically split your app domain from your main domain. This makes working with different teams much easier. Especially if you want to hire a designer to build and design your app. They often use a website builder and makes your life much easier.

Then for your email set up 2 extra domains to make sure your main domain stays clean in case you ever get flagged for spam. You should be using something like resend to make sure this doesn’t happen in the first place, but even they recommend setting it up like this.

And lastly have google index your public pages by setting up a sitemap.xml

Hope this helps, follow for more :)

#coding #developer #vibecoding #productmarketing

**Transcript:**
Okay, I just put the domain now what all right awesome. Let's get ready for long Jeff to set up these three things Okay, done. Okay. Number one is we're going to separate our main domain from our subdomain This way our marketing and design team doesn't have to work in our code base We're making changes to the home page Just set up a new C name type app in the name field and point to where our app is hosted Okay, done. Okay. So step two is to set up two more subdomains one for our app emails like signups and billing and one for Our marketing emails we split this up from the main domain in case our emails ever get flagged as spam Just go to recent at the subdomains and configure the email domains with SPF Decom and D mark Okay, nice done. Cool. And number three is once you connect the home page to the main domain We have to set up a site map dot XML that lists all of our public pages Then go to Google console and tell Google to index the public pages of our website Well, where did you even learn this? Oh, I follow Nico. He talks about building and shipping apps


## Reel 2 — DaQGd3kMiyV
lang=en dur=32s

**Caption:**
Here are two ways how you can set your app up for bots. 

Use robots.txt if you want to control what pages should get crawled. Honestly don’t worry about it too much if your app is mostly locked behind a login.

It won’t protect you against malicious bots though. So make sure to add cloud flare turnstile to your app if you want to prevent data scraping.

#coding #developer #vibecoding

**Transcript:**
Here are two ways to protect your app from bots. Number one is for the good bots and it's a robots.txt file in the root folder of your app. Companies like Stripe, Anthropic or OpenAI all have one configured. It's a simple txt file that tells bots which parts of your site they should crawl and which they shouldn't. But unfortunately a text file won't stop the bad bots from scraping your data. So if you want real protection without making your users play where's Waldo for the sixth time finding a bus, use number two, turnstyle. It's from Cloudflare but you don't have to host your app with them. Anyone can use it and it's free. And to set it up you can use this skill. I hope this helps and follow for more.


## Reel 3 — DadAs7rO-KV
lang=en dur=51s

**Caption:**
Marketing is annoying but important. If you don’t have distribution but a perfect app you still don’t have a business and no users.

I use this github repository from coreyhaines for most of my marketing. 

In there you will find 42 AI marketing skills that you can use to get users for your app.

#coding #development #vibecoding #productmarketing

**Transcript:**
marketing sucks is this one a build same but did you know that there's a github repo with over 40 skills that can help you with it no tell me more basically there's one main skill that has all the contacts of your app the other 41 read that context and give you advice build around your app whoa okay but which ones are the most useful here to number one is called launch it includes things like a launch checklist a proven step-by-step launch strategy and a product hunt playbook that's great with number two number two is called marketing ideas it reads your contacts and gives you a recommendation on what to do next from over 130 proven SAS marketing ideas okay how do I set this up just create a new folder then go to cloud code select the folder and use this prompt to install them you can also use the terminal next use slash reload skills then run slash product marketing to start the process whoa where did you even learn this oh I follow Nico he talks about building and shipping apps


## Reel 4 — DaAiIwqs34q
lang=en dur=36s

**Caption:**
Don’t launch your app before setting up these 3 emails.

It’s super easy to set up but can save you a lot of headaches related to spam later on.

Follow for more tips like these

#developer #coding #vibecoding #productmarketing

**Transcript:**
Never launch your app without these three emails. Email number one is for your app. Sign up, spillings, password resets, anything automated. Set it up on a subdomain like this so if it ever gets flagged for spam, your main domain stays clean. And definitely use something like Resend to make sure it doesn't get flagged in the first place. Email number two is for your main inbox. This is for everything human written. Think contact, support, or your email. You can host this on your main domain but protect it at all costs. Try not to send automated emails from this domain. And one bonus email is a marketing email. Host it also on a subdomain like this. It's especially useful if you ever run a newsletter or a marketing campaign because it also protects your main domain. If you're interested in building apps, make sure to follow.


## Reel 5 — DZ44PyhMSVe
lang=en dur=43s

**Caption:**
Don’t launch your app without a lifetime deal.

Especially early on it can bring in early capital to reinvest in the business and to get early user feedback.

#coding #developer #vibecoding #productmarketing

**Transcript:**
Don't launch your app without offering a lifetime deal. My name's Mike. I've currently got three SaaS businesses doing over 200 grand a month. Call to how we make money early on is the third point in our playbook. Offer a lifetime deal. Offer away your product for $59, $100, whatever it is for a single-time payment. Basically, you get early capital to reinvest and user feedback to improve your app fast. Now, there is a platform with over a million people looking for exactly these kind of deals. It's called AppSumo and it's ideal if you're in the B2B market. But even without the platform, it's just a good strategy to grow early on and validate your idea. To set up a lifetime deal, I recommend using Polar Overstripe. You can just add a one-time purchase and add a benefit to control what the users have access to. Hope this helps. Follow for more.


## Reel 6 — DZ2R37uM6nT
lang=en dur=27s

**Caption:**
Don’t launch your app before adding an onboarding checklist to your app.

You should make it as easy and clear as possible to get to value in your app.

I made a shadcn component for it. Let me know if you want it.

#coding #developer #vibecoding #productmarketing

**Transcript:**
One thing I wish I knew before launching my first app is adding an onboarding checklist. Companies like Stripe, Revolute or Linear do exactly that. That's because they want to get their users to an aha moment as fast as possible. In your app, you want to shorten the time to value as much as you can. I could not find a single free Shatzi and Block for this, so I made this one myself. Either come and block and I'll send the code to you, or screenshot this and have Claude designed it for you. Then make sure to store the state in a database for future sessions. I hope this helps. Follow for more.


## Reel 7 — DZxJrsmsjPE
lang=en dur=28s

**Caption:**
Don’t launch without reading through this repository. 

This will make your stripe payment flow much more reliable and keeps your app in sync at all times.

#developer #coding #vibecoding #stripe

**Transcript:**
One thing I wish I knew before launching my first app is this GitHub repository. It explains one of the biggest stripe mistakes developers make. The problem is what Theo calls the split brain. Basically when a user makes a payment, the state of the payment lives in Stripe. But then you expect it to keep your user database in sync by constantly listening and handling messages coming from Stripe. To implement and write, just go to GitHub and search t3.gg Stripe Recommendations. Or go to YouTube and watch Theo's video. Just search for iFix Stripe. Good luck.


## Reel 8 — DZmz-gGsAqG
lang=en dur=42s

**Caption:**
Don’t use Stripe without knowing about the merchant of record.

Best to use Polar in the first place imo.

This can save you a lot of trouble later on!

#stripe #polar #merchantofrecord #coding #developer

**Transcript:**
Coming from a software developer, don't use Stripe without knowing this one thing. If you plan on having international users, you'll be responsible for reporting VAT and sales tax in the countries of your users. This is part of being what's called merchant of record. And if you're just using the basic 2.9% Stripe integration, you are the merchant of record. Sounds complicated, but if you don't do this, you can get into serious trouble later on. Stripe does have a merchant of record option that does this for you. It's called managed payments, but it's not cheap. Essentially, it's an additional 3.5% on top of the 2.9% transaction fee. Instead, what I usually do is I use Polar for most of my projects. They're actually built on Stripe and not only do they handle the merchant of record for you, they're also cheaper, easier to use and handle things like tiered subscription for you. I'll make a detailed video about them soon, so make sure to follow.


## Reel 9 — DZkKt_5u2aE
lang=en dur=31s

**Caption:**
The one thing that vibe coders often forget to add to their apps is product analytics.

But it’s one of the most important tool to understand what you should be focusing on next.

#coding #developer #productmarketing #vibecoding

**Transcript:**
One thing VibeCut has constantly forgot to add is product analytics. Coming from a software developer, it's the one thing I always add to my apps. Product analytics show you how your users are actually interacting with your website. One thing I like to do is set up a north star metric to track how well my websites perform. For example, the last project I worked for was a crypto alternative for Twitch. So we tracked for minutes watched and minutes streamed to track how well the platform was doing. This made it much easier to make decisions for the product because we would try and optimize for these numbers. Here are just some examples of north star metrics to help you define one for your project. Follow for more product marketing tips.


## Reel 10 — DZaHDWLs6RG
lang=en dur=38s

**Caption:**
You can now build dashboards that don’t look ai generated! 

Just choose a block from the shadcn blocks and copy the prompt into claude

Adapt the design to you use case and connect it to your data.

#shadcn #vibecoding #uidesign

**Transcript:**
You can now build dashboards that don't look like I generated in under 10 minutes. Here's the 3 step process. Step 1 go to this side and choose a dashboard block you like. Copy the prompt and paste it into cloud code. Step 2 prompt cloud code to adapt it to your use case. In my case I'm building a dashboard that tracks my gym progress and my protein intake so I have cloud redesigned it with that. Step 3 replace the demo data with your data. I'm using Convex as my database since it's the easiest to set up but anything works. These dashboards are based on Shazian if you haven't heard of it. It's essentially a foundation for your design system that you can customize as you like. You can check it out here and follow for my build tips.


## Reel 11 — DZFc1axs51T
lang=en dur=47s

**Caption:**
How to set up funnel analytics on your website.

Go to posthog, create an account, and copy the snippet into your website.

Click through your funnel so posthog detects the relevant events for your funnel steps.

Then set up the steps with the registered events.

Follow @buildwithnico for more website tips

#analytics #webdesign #website #posthog #funnel

**Transcript:**
How to set up funnel analytics like this to see exactly where people drop off on your website. Step 1. Go to this site and create a new project. Copy this into your terminal or click set up manually, select framer and copy the tracking snippet into the head tag of your website. This will start tracking where users come from, what they do and how long they stay. Step 2. Once set up, click through your funnel so postdocs starts registering the events you need. I want to track for form submissions so I open the form, interact with it and submit it. Step 3. Create a new funnel view in postdoc and add the events to the funnel. In my case I track for pageviewed, cta clicked, form field interaction and form submission. The tool is free, open source and even has a built in AI that you can ask questions about your data. Save this for when you launch your next site.


## Reel 12 — DZVPs-ARxMP
lang=en dur=20s

**Caption:**
action is the only way this strategy becomes valuable 

#startups #entrepreneurship #founder #buildinpublic

**Transcript:**
Let's see if you actually understand startup strategy. TAMSAMSOM, beachhead market, network effects, switching costs, competitive advantage, barriers to entry, market timing, category creation, vertical SaaS, horizontal SaaS, platform models, marketplaces, aggregators, red ocean, blue ocean. If you know those, you're basically a CEO. Go Bill. Cheers.
