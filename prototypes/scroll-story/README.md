# "Every group chat has these four": scroll-story prototype

A landing-page prototype that goes past the frozen Talk back hero (`../interactive-hero/`, unchanged). Scrolling moves the clock from Wednesday afternoon to Saturday morning while one group of four friends gets from "so… where?" to a plan. It ends with a share loop: say who's who in your own group and send it to the group chat. The link opens the page with their names on it.

It lives outside `public/`, so it is not part of the Netlify site and nothing here is deployed.

## Chapters

| # | Chapter | Scroll behaviour | Always running |
|---|---|---|---|
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
- Ambient loops animate only decoration, never text you are reading. They pause when their chapter is off screen, and the "Pause motion" button stops all of them (WCAG 2.2.2).
- `prefers-reduced-motion`: no pins, no scrubbing, no loops; every chapter is laid out finished on its own colour. Same without JavaScript.

## Photos

Real photos from Unsplash (Unsplash License), chosen through the official API with no recognisable faces. Photographers and photo pages are listed in `img/CREDITS.json` and credited in the footer, which also says the photos show real places but not the venues in the example. Each photo was registered with Unsplash's download endpoint. Unsplash's API guidelines prefer hotlinking from images.unsplash.com; these are self-hosted, cropped copies, which the licence allows.

## Run it

```sh
node build.mjs                         # index.html, dist/scroll-story.html (single file), dist/artifact.html
python3 -m http.server 8790            # from prototypes/, then open http://127.0.0.1:8790/scroll-story/index.html
node test/shots.mjs <url> <outdir> 1440 900 1           # a screenshot per screen
node test/shots.mjs <url> <outdir> 1440 900 .5 reduced  # the same with reduced motion
node test/record.mjs <url> <outdir> desktop|phone       # scripted walkthrough video
```

The test scripts need `playwright` resolvable from this folder (a `node_modules` symlink to the global install works; it is git-ignored).
