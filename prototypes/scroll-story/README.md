# "Every group chat has these four": scroll-story prototype

A landing-page prototype that goes past the frozen Talk back hero (`../interactive-hero/`, unchanged). Scrolling moves the clock from Wednesday afternoon to Saturday morning while one group of four friends gets from "so… where?" to a plan. It ends with a share loop: say who's who in your own group and send it to the group chat. The link opens the page with their names on it.

It lives outside `public/`, so it is not part of the Netlify site and nothing here is deployed.

## Chapters

| # | Chapter | Scroll behaviour | Always running |
|---|---|---|---|
| 0 | The film (opening) | Pinned briefly. The words lift away, the film closes into a rounded card and the page turns to daylight as the chat arrives | A 17-second film loop of phones lighting up and Delhi going out; the group's messages pop up as notifications in time with the shots |
| 1 | The chat (hook) | Pinned. Messages arrive, the unread count climbs, the clock runs Wed 4:12 PM → Thu 11:49 PM, then "47 messages · 4 asks · 0 plans" | Someone is always typing; two bubble-clipped photos bob |
| – | Ticker | – | The group's lines scroll forever and speed up with your scroll |
| 2 | The four | Sticky card deck; each card shrinks and darkens as the next lands; photo parallax | Photos drift slowly |
| 3 | Planic weighs it | Pinned. Six option photos land, five get stamped out in the colour of whoever ruled them out | – |
| 4 | The plan | Pinned. The board-game photo opens from a dot to full screen, then the plan and its reasons arrive | Each person's dot pings in turn |
| 5 | Your turn | Talk back on the frozen engine: change what someone said, the plan answers or says why it held | – |
| 6 | Friday 9:30 PM | Snapshots pass at four depths, some in front of the words and some behind | Snapshots bob |
| – | Ticker | – | "which one are you?" |
| 7 | Send it to your four | The "decoded" card swings in | Coloured dots breathe |
| 8 | Join | Early-access form (prototype: validates, never submits) | – |

A fixed sky layer changes colour between chapters (day, paper, afternoon gold, violet, deep violet, night, coral, ink), so the sections flow into each other.

## Pointer and touch

With a mouse, a follower changes over things: it takes a person's colour over anything of theirs, opens into a caption over photos, grows over buttons and shrinks over text. Buttons lean toward the pointer, photos tilt like a picked-up print, words in the headline lift, bubbles and reasons nudge, and a soft light follows the pointer on dark chapters. On touch, every tap leaves a ripple in the colour of whoever is under your finger, and buttons press in.

## Motion rules

- Scroll-linked motion uses GSAP 3 + ScrollTrigger (`vendor/`, GSAP's standard no-charge licence). Native scrolling, no smooth-scroll library.
- Ambient loops animate only decoration, never text you are reading. They pause when their chapter is off screen, and a small pause icon next to the clock in the top bar stops all of them, the film included (WCAG 2.2.2).
- `prefers-reduced-motion`: no pins, no scrubbing, no loops; every chapter is laid out finished on its own colour. Same without JavaScript.

## Photos

Real photos from Unsplash (Unsplash License), chosen through the official API with no recognisable faces. Photographers and photo pages are listed in `img/CREDITS.json` and credited in the footer, which also says the photos show real places but not the venues in the example. Each photo was registered with Unsplash's download endpoint. Unsplash's API guidelines prefer hotlinking from images.unsplash.com; these are self-hosted, cropped copies, which the licence allows.

## Opening film

`film/open-wide.mp4` (1280×720) and `film/open-tall.mp4` (720×1280, picked for portrait screens), each about 1.8 MB, H.264, no sound, 17.2 s loop. Cut with ffmpeg from free Pexels clips (Pexels License): seven shots, cross-faded, chosen so no face is recognisable (crowd shots are from behind or far away). The footer says the film shows other people and places. `film/poster-*.webp` is the still frame shown before it plays, with reduced motion, without JavaScript, or when a browser refuses to autoplay. The film plays only while on screen and stops with the pause icon.

## Alive

- **Threads** (`alive.js`, `threads()`): four coloured threads in the left margin, one per friend. They tangle through the chat, run in neat lanes for the four people, cross while the options are weighed, braid into one white line as the plan lands (with a small knot pulse), part for Friday night and end as one line at the join. Drawn every frame from the scroll position; positions come from the chapters after each ScrollTrigger refresh.
- **Living headlines** (`alive.js`, `liveWords()`): headline words drop in under gravity, float a little, lag and catch up with your scroll, lean away from the pointer, and can be grabbed and flung (a tap makes them hop on touch). Each word is a spring that always returns home. Paragraphs, the plan details and anything you read closely never move this way.
- **Your pick follows you**: after "That's me", `body[data-me]` marks your thread, bubbles, ask, chips and plan row as "you", the night chapter adds a line for you, and the button bursts in your colour (with a short vibration on phones that allow it).
- **Story card**: "Save as image" draws a 1080x1920 "Our group chat, decoded" picture with the names typed in, and opens the share sheet where files can be shared, otherwise downloads it.
- All of it stops with the pause icon and is absent with reduced motion.

## Link preview

`og.jpg` (1200x630, made from `og-source.html` with a headless browser) is the picture WhatsApp and others show when the link is pasted. `og:image` is a relative path here; on the live site it must be the full https URL, because most apps ignore relative preview images. Invite links with names in them show the same preview; a personalised preview would need a server.

## Run it

```sh
node build.mjs                         # index.html, dist/scroll-story.html (single file), dist/artifact.html
python3 -m http.server 8790            # from prototypes/, then open http://127.0.0.1:8790/scroll-story/index.html
node test/shots.mjs <url> <outdir> 1440 900 1           # a screenshot per screen
node test/shots.mjs <url> <outdir> 1440 900 .5 reduced  # the same with reduced motion
node test/record.mjs <url> <outdir> desktop|phone       # scripted walkthrough video
```

The test scripts need `playwright` resolvable from this folder (a `node_modules` symlink to the global install works; it is git-ignored).
