# PLANIC — Website Redesign Brief

**Status:** Direction to execute  
**Scope:** Public marketing / early-access website only  
**Repository:** `nisdudeheckz/Planic-Web`  
**Deployment:** Netlify static site; `public/` is the publish directory  
**Primary objective:** Make Planic's product thesis felt through the website's narrative, visual identity, interactions and engineering—not merely described in copy.

---

## 1. The governing principle

**Make Planic unmistakably Planic, with a level of design intention and execution comparable to the best authored product websites.**

Auteur HQ is a benchmark for storytelling, hierarchy, restraint, interaction quality, motion and technical execution. It is **not** a template to clone. Do not reproduce its layout, compositions, wording, colors, or signature visual motifs. Inspiration is about the standard of craft—not borrowed identity.

Planic's philosophy informs its narrative; the narrative informs its visual language; the visual language informs its interactions; engineering makes the whole experience feel effortless.

The finished website should feel authored, expressive, youth-relevant, warm, witty and alive. It must not look like a generic AI-startup template, a directory of places, or a product page assembled from unrelated animated cards.

## 2. Product truth: what the website must communicate

Planic helps a group move from a vague intention—“let's go somewhere”—to a concrete plan that the group actually wants to do and can act on.

The problem is not a lack of places to browse. It is the friction of making a shared decision when people have different preferences, budgets, locations, schedules, energy levels and ideas of a good time.

Planic's intended value is to interpret the group's context, consider preferences and constraints together, and produce its own considered recommendations. External place data (including Google Places, where used) is an input—not the whole recommendation engine and not a substitute for Planic's own ranking logic.

### Product and messaging guardrails

- The MVP is **group-first**, with New Delhi as the initial launch/testing geography.
- Voice-first interaction is an important part of the product direction. The site can communicate natural, low-friction input, but must not imply a working live voice feature unless that is verified in the current product.
- Present the experience as personalized group planning, not “AI finds places for you.”
- Show how preferences and constraints converge into one useful plan. Do not frame the product as group chat software alone.
- Preserve the human payoff: less deciding, more doing together.
- Product screens on the marketing site are conceptual previews unless confirmed as live functionality. Label previews honestly.
- Do not invent capabilities, integrations, user counts, testimonials, partner logos, performance metrics, availability, or launch dates.
- Audit claims like “94% fit” or “81% fit.” Keep numerical fit scores only if there is a real, explainable calculation behind them. Otherwise use qualitative labels such as “strong group fit” or show the trade-off that made the option suitable.
- Do not make absolute claims about perfect agreement or guaranteed satisfaction. Planic should help groups reach a better decision, not promise unanimity every time.

## 3. Audience and desired response

The primary audience is socially active young adults and groups who regularly make informal plans: friends deciding what to do after class or work, on a weekend, or for a spontaneous outing. The initial geography is New Delhi, but the brand should not feel geographically limited to a tourist guide for Delhi.

After visiting the page, someone should be able to answer:

1. What is Planic?
2. What frustrating situation does it solve?
3. How is it meaningfully different from browsing a list of venues or asking a generic chatbot?
4. What might using it feel like?
5. What should I do next?

**Primary conversion:** join early access.  
**Secondary conversion:** understand the concept by exploring the page.  
The site should feel trustworthy and exciting without implying the product is more complete than it is.

## 4. What already exists and should be respected

The `Planic-Web` repository is a small static site, separate from the Planic application repository. Current implementation uses:

- `public/index.html` — page structure, copy, product-preview UI and early-access form.
- `public/assets/styles.css` — the brand system, layout, responsive rules and animation styles.
- `public/assets/main.js` — mobile navigation, scroll reveals, footer year and Netlify form submission.
- `netlify.toml` — publishes `public/` and defines basic response headers.
- Plain HTML, CSS and vanilla JavaScript; no framework or build step is required.

The existing page has useful ingredients: a clear headline, an intentionally designed phone mockup, group-message fragments, a problem section, a three-step explanation, product-preview screens, a differentiator section and an early-access invitation. Treat these as assets and story material—not as disposable work.

### Preserve unless an audit finds a concrete reason to change

- The core proposition: turning “let's go somewhere” into a plan people actually want to do.
- The warm, light foundation and expressive violet/coral accents.
- The existing display/body type direction as a starting point (Bricolage Grotesque and Instrument Sans), subject to checking readability and loading impact.
- The honest early-development framing and early-access flow.
- Static-site simplicity and Netlify deployment compatibility.
- The useful bespoke UI details in the current mockups.

Do not rebuild everything from scratch simply to make the diff look substantial.

## 5. Visual direction

### Desired character

**Editorial clarity + social energy + product-interface precision.** A little unexpected, tactile and playful, but never childish or chaotic. High visual ambition should come from composition, typography, timing, contrast and custom interface details—not an excess of effects.

### Palette

Use the existing palette as the foundation:

- Warm paper / ivory: `#F7F4EE`
- Deep ink: `#111216`
- Periwinkle / violet: `#7567F8`
- Coral: `#FF6B61`
- Soft lavender: `#B8AEFF`

Other supporting colors may be used deliberately for people, preferences, or status states. Maintain accessible contrast and avoid introducing a rainbow of unrelated accents. If changing a token, explain what visual or usability problem the change solves; don't replace the identity without a reason.

### Typography and layout

- Give the hero a confident typographic composition and clear reading order.
- Use size, line breaks, tight but readable tracking and deliberate negative space to create hierarchy.
- Keep paragraph measure comfortable. Do not force awkward line breaks that only work at one viewport width.
- Establish rhythm across sections: alternate density, whitespace, scale and background treatment instead of repeating the same centered heading + card grid pattern.
- Use asymmetry where it strengthens the narrative; ensure the page remains clear and composed on mobile.
- Keep the Planic wordmark and graphic identity consistent throughout.

### Avoid

- A clone of Auteur's site, or any other reference site.
- Generic AI visuals: glowing brains, neural-network meshes, random gradients, stock people pointing at laptops, or meaningless code motifs.
- Glassmorphism applied everywhere, arbitrary floating blobs, parallax for its own sake, excessive pill cards, and repeated “feature card” layouts.
- Effects that compete with the product message, obscure copy, slow scrolling or make mobile interactions tiring.
- Inventing a mascot or an unrelated illustration style without establishing why it belongs to Planic.

## 6. Narrative and section-by-section direction

The whole page should read as one experience: **vague intention → real group context → considered trade-offs → a plan worth acting on.** Keep the strongest existing copy where it works; refine only where clarity, credibility or rhythm improves.

### 6.1 Navigation

Keep the navigation calm and lightweight so the hero remains the focal point. Maintain a clear early-access CTA and working section links. On mobile, the menu must be reliable, keyboard accessible and easy to close; it must not cover or trap the page unintentionally. If a sticky/blurred header remains, check contrast and compositing while scrolling.

### 6.2 Hero — make the promise feel alive

Keep the core headline idea. The hero must answer “what is this?” immediately and pair that answer with a distinctive visual event that can only plausibly belong to Planic.

The product visual should be the primary spectacle, not a decorative background. Consider a clear composition in which separate group inputs (messages, preferences, budget, timing, distance) enter as distinct signals, become organized, and resolve into a tangible plan card or plan preview. Ensure the effect reads as a meaningful transformation even if the visitor sees it only briefly.

Keep the primary CTA obvious. The secondary CTA may lead to the explanation/story. Retain the “currently building in New Delhi” detail if still accurate, but keep it subordinate to the promise.

Do not stack so much copy and ornament into the hero that the headline loses impact. Avoid a visual that looks like a generic phone floating in gradient blobs. The hero should create curiosity and establish the design language in the first few seconds.

### 6.3 The problem — recognize the group-chat stalemate

The existing “So… what are we doing?” exchange is a strong, relatable premise. Make it feel like a miniature social scene rather than a static list of speech bubbles. Use timing, alignment and interruption sparingly to convey the familiar mess of conflicting preferences and non-answers.

The sequence should be readable without animation. Motion may emphasize that more messages are not producing a decision; it should not make users wait for the content or simulate an actual messaging service unnecessarily.

### 6.4 How it works — demonstrate interpretation, not magic

Keep the explanatory progression but connect its three steps visually:

1. Someone expresses an intention naturally.
2. Planic considers group preferences and constraints together.
3. The group gets a considered proposal it can accept, adjust or act on.

The second step is the differentiator. Show real, understandable trade-offs—budget, location, timing, food preferences, activity style—rather than a fake AI “thinking” animation. Prefer visible cause and effect: an option changes because of a real constraint in the illustrative scenario.

Do not create separate disconnected illustrations for each step. Reuse a visual grammar so the viewer feels the same pieces moving through a process.

### 6.5 Product preview — make the interface earn trust

Treat the existing mockups as a product artifact, not decoration. They should look internally consistent, legible and intentionally composed. Make sure labels and example scenarios agree between the hero, steps and product preview.

Choose fewer, stronger screens rather than displaying every screen at equal visual weight. If horizontal scrolling remains, it must be discoverable, keyboard-friendly and usable on touch devices; do not make essential information available only through a fiddly carousel.

The screen content must be legible at realistic desktop and mobile sizes. State clearly that screens are concepts when applicable. Do not imply that prototype details, venues, fit scores, or times are live recommendations.

### 6.6 Differentiator — explain why Planic is not a directory or generic chatbot

The section currently titled “Not another place to browse” should land one focused argument: Planic considers the group as a whole and helps turn discovery into a shared decision. Make that difference specific and tangible, not a checklist of vague AI benefits.

Use a comparison or interaction only if it clarifies the product thesis. Do not make unsupported competitor claims or disparage named products.

### 6.7 Early access and footer — a clear, credible invitation

The final CTA should feel like the natural conclusion of the story: “be there for the first plan” or similarly human language that preserves the existing invitation's spirit. Keep one obvious action, explain what signing up means, and be honest about the stage of development.

Preserve Netlify Forms functionality. Verify the actual deployed submission path, success/error states, keyboard behavior, validation, duplicate submissions and mobile layout. Never replace a working form with a decorative imitation. Keep privacy/contact links accurate and working.

## 7. Signature interaction: “from many signals to one plan”

This is the central creative opportunity. Explore a distinctive product-led transition with a clear beginning, middle and end:

- **Input:** a small number of distinct group signals appear—e.g., “vegetarian options,” “under ₹800,” “after 7,” “somewhere new.”
- **Interpretation:** signals are organized into understandable preference/constraint groups. The UI can briefly show a trade-off being considered.
- **Convergence:** irrelevant or poor-fit options recede, and one considered plan becomes the focal artifact.
- **Payoff:** the plan card communicates the useful outcome in one glance: what, where/area, when, and why this fits the illustrative group.

Requirements:

- Keep the interaction short and comprehensible. It must not depend on a visitor scrolling at precisely the right speed.
- Provide a complete static state; the page's meaning must survive disabled motion, a slow device, a missed animation or JavaScript failure.
- On mobile, simplify movement and scale rather than shrink an intricate desktop composition into illegibility.
- Avoid scroll hijacking, long pinned sections that make the page feel trapped, or animations that prevent normal reading.
- If scroll-linked animation is used, keep its progress natural and ensure content remains available to assistive technology. Prefer a small number of well-timed state transitions over a continuous parade of effects.
- Do not simulate voice capture, AI processing, live rankings or group consensus as real product functionality. Clearly present the sequence as a concept/demo if necessary.

## 8. Motion and interaction principles

Every animation must serve one of four jobs: establish hierarchy, communicate a relationship, reveal a state change, or reward a meaningful action.

Use a restrained motion system: consistent easing, intentional durations, coherent stagger, and no random animation timings. Keep hover effects useful but never rely on hover for essential information.

- Respect `prefers-reduced-motion`; reduced motion should remove nonessential movement without hiding content or breaking the story.
- Avoid flashing, excessive bouncing, large continuous background motion or scroll-triggered movement that causes nausea.
- Use `IntersectionObserver` or CSS for simple reveals where appropriate. Add a motion library only if a specific interaction genuinely benefits from it; justify the dependency before installing it.
- Prevent layout shift when elements enter or change state.
- Do not make the user wait for a hero animation before they can read or act.
- Test animations on a mid-range mobile device or emulate constrained CPU where possible.

## 9. Technical and engineering constraints

### Architecture

- Work in `nisdudeheckz/Planic-Web`, not the main Planic application repo.
- Inspect the existing HTML, CSS and JS before editing. Read the entire file and understand all page sections, form attributes, responsive rules and deployment settings.
- Default to the current static architecture: semantic HTML, CSS and small vanilla JS enhancements. Do not migrate to React/Next.js or add a build system solely to enable a redesign.
- Keep code modular and readable. Use CSS custom properties for shared design tokens and reusable component classes for repeated patterns.
- Avoid huge inline scripts, duplicated style overrides, brittle selector chains, unnecessary dependencies and unbounded abstractions.
- Preserve the Netlify publish directory and form detection/submission behavior.
- Do not change unrelated application code or backend behavior.

### Responsive behavior

Design for small screens first, then compose the desktop experience—not simply scale down a desktop layout. Verify at minimum around 320px, 375px, 430px, 768px, 1024px and 1440px widths.

Check headline wrapping, CTA order/size, phone/mockup clipping, decorative overflow, nav height, rail scrolling, form labels, focus outlines and section spacing. No horizontal page overflow. Touch controls should be comfortably usable and must not depend on hover.

### Accessibility

- Use semantic landmarks and a logical heading hierarchy.
- Preserve a visible keyboard focus state and a working skip link.
- Interactive controls need accessible names, states and keyboard behavior.
- Do not convey status or fit using color alone.
- Ensure contrast for text, controls and muted copy.
- Provide sensible reduced-motion behavior and a usable no-JavaScript reading path wherever practical.
- Mark purely decorative graphics as hidden from assistive technology; give meaningful visuals appropriate accessible descriptions.

### Performance and resilience

- Keep JavaScript and CSS lightweight; avoid large libraries and unnecessary third-party scripts.
- Avoid loading oversized image/video assets as the centerpiece unless a measured need justifies them. Prefer CSS/SVG/interface-based visuals where they provide the desired quality.
- Avoid expensive continuous filters, blur effects and layout-triggering animation on mobile.
- Ensure the page still renders useful content if a font request or enhancement script fails.
- Do not add analytics or tracking without explicit approval and a clear need.

## 10. Implementation workflow for Claude Code

Work in focused stages so each pass has a clear purpose and can be reviewed. Do not try to solve every visual detail at once.

### Pass 0 — inspect and plan

1. Inspect `public/index.html`, `public/assets/styles.css`, `public/assets/main.js`, `netlify.toml`, and all linked local assets.
2. Confirm the deployed Netlify site is actually connected to this repository and publishes `public/`; do not change deployment settings unless needed.
3. Run the site locally if the tools/environment permit. Capture the current state and note any existing bugs.
4. Identify the highest-impact changes and any risks to the form, mobile navigation, reduced-motion handling or content.
5. Write a concise, file-specific implementation plan before editing. Call out any claim or visual that may imply an unbuilt feature.

### Pass 1 — establish the design system and hero

Refine the design tokens, typography scale, spacing and core components only as needed. Build the hero and the signature many-signals-to-one-plan visual first. Check the result on mobile and desktop before repeating its visual language elsewhere.

### Pass 2 — connect the narrative

Rework the problem, how-it-works, product-preview and differentiator sections into a coherent sequence. Reuse interface elements and visual motifs with purpose. Preserve strong copy and form functionality.

### Pass 3 — polish and validate

Refine transition timing, section rhythm, microinteractions and details. Test responsive states, reduced motion, keyboard use, navigation, links and the complete early-access submission flow in the local/deployed environment as available.

### Required reporting after implementation

Report:
- What changed and why.
- Files modified and any dependencies added (prefer none).
- How the signature interaction works and what happens in reduced-motion mode.
- What was tested and what could not be tested.
- Any remaining visual/technical risks or unverified assumptions.

Do not claim a test passed unless it was actually run.

## 11. Acceptance criteria

The redesign is ready for review only when all of the following are true:

### Product and narrative
- [ ] A first-time visitor can identify what Planic does in a few seconds.
- [ ] The site explains group decision-making, not merely place discovery or AI chat.
- [ ] The visual story makes the transition from fragmented inputs to a coherent plan clear.
- [ ] The site retains Planic's own identity and does not visibly clone Auteur or another reference.
- [ ] Conceptual product screens and illustrative data are represented honestly.
- [ ] The early-access CTA is easy to locate without overwhelming the story.

### Design quality
- [ ] The hero is distinctive, legible and product-led.
- [ ] Sections feel connected but not mechanically repetitive.
- [ ] Spacing, typography, color and hierarchy are consistently authored.
- [ ] Motion is purposeful, coherent and never required to understand the page.
- [ ] The design looks intentional at phone, tablet, laptop and large-desktop sizes.

### Engineering quality
- [ ] No horizontal page overflow or clipped essential content at tested widths.
- [ ] Mobile menu, in-page links and CTAs work with pointer and keyboard.
- [ ] Reduced-motion preferences are honored and content remains visible.
- [ ] Early-access form retains validation, success/error behavior and Netlify submission compatibility.
- [ ] No console errors, broken local assets or dead links in tested flows.
- [ ] No unnecessary framework migration or unexplained dependency additions.
- [ ] Actual verification is documented honestly.

## 12. First task to give Claude Code

Paste the following into Claude Code from the root of `Planic-Web`, with this brief available in the repository (recommended path: `docs/PLANIC_WEBSITE_REDESIGN_BRIEF.md`).

> Read `docs/PLANIC_WEBSITE_REDESIGN_BRIEF.md` completely before making changes. Then inspect the full current implementation in `public/index.html`, `public/assets/styles.css`, `public/assets/main.js`, and `netlify.toml`.
>
> Do not start coding blindly. First return a concise, file-specific audit of the current site, identify the three highest-impact design opportunities, flag any misleading or unverified product claims, and propose a staged implementation plan consistent with the brief. Explicitly preserve the current static-site/Netlify setup and the early-access form unless you identify a concrete issue.
>
> The key creative challenge is to make Planic's landing page demonstrate the transformation from messy, conflicting group inputs into a thoughtful plan. The result should be visually authored, expressive and alive, while clearly remaining Planic—not an imitation of Auteur. Motion must have narrative purpose, and the site must remain excellent on mobile, accessible, performant and maintainable.
>
> After the audit and plan, proceed with **Pass 1 only**: refine the design system as needed and implement the hero plus the signature “many signals → one plan” visual. Do not redesign every section in the same pass. Test the hero at mobile and desktop sizes, respect reduced motion, and report the exact files changed, verification performed, and remaining issues. Do not claim any test passed unless you ran it.

---

## Final decision rule

When choosing between a flashy effect and a clearer demonstration of Planic's value, choose the clearer demonstration. When choosing between copying a reference and expressing Planic's own product thesis at the same level of craft, choose Planic. When choosing between a sweeping rewrite and a small change that can be verified, choose the smallest change that achieves the intended result—unless evidence shows a larger change is necessary.
