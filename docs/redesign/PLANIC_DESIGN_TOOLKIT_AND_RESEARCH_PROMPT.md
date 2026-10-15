# PLANIC — Design Toolkit & Research Prompt

**Purpose:** a reusable toolbox index and working brief for Claude Code. This is a menu of resources to investigate by utility—not a list to install wholesale.

**Project:** `nisdudeheckz/Planic-Web` marketing site, currently HTML/CSS/vanilla JS deployed through Netlify. The main Planic product repository is separate.

**Status note:** links and publicly documented capabilities were checked on 15 October 2026. Availability, permissions, plugin catalogues, prices and licences can change; Claude must verify them from the source before use. A link in this document does not mean a tool is installed, authenticated, visually accessible, or approved for use.

---

## 1. Non-negotiable product context

Planic helps groups turn a vague intention—“let's go somewhere”—into a concrete plan the group is more likely to agree on and actually carry out. It considers distinct preferences, budgets, timing, location and other constraints; evaluates candidate options against the people involved; explains why options fail; and makes trade-offs honest rather than pretending every option is perfect.

The intended product is group-first and voice-first, with New Delhi as the initial geography and a proper native mobile app as the longer-term destination. Planic intends to own its recommendation/ranking logic; Google Places may provide data, but simply repeating Google's ranking is not the product thesis.

The marketing site must communicate that human problem and product philosophy without pretending unfinished capabilities are live. Keep examples clearly illustrative. Do not invent fit scores, guaranteed consensus, actual travel-time calculations, live AI processing or any other unsupported capability.

### Creative mandate

The target is a **living, responsive, participatory web experience**—not just an attractive page or a narrated animation. The visitor should be able to influence at least one meaningful part of a demonstration and see the experience respond. Cursor, hover, drag, touch, keyboard, scroll, kinetic typography, spatial composition, generative visuals, Canvas/WebGL or other techniques are candidates, not requirements.

Planic should feel authored, emotionally engaging, youthful without being gimmicky, philosophically connected to the product, and technically excellent. Learn from exceptional references; do not reproduce their visual identities. Auteur is a benchmark for ambition and interaction quality, not a template or an instruction to make an “Auteur-like” website.

We have explored Marginalia, The Overlap, Convergence and Four Pens. Treat all of these as research artefacts, not binding designs. The existing website is a source of useful copy, product truth and working behaviour—not a constraint that forces the redesign to preserve the current layout. A clean rebuild in an isolated branch/worktree is allowed if research supports it. Do not delete the repository, overwrite the live site, merge PR #3, or deploy without explicit approval.

### Existing brand starting points (not a prison)

Warm off-white/paper, near-black typography, violet/periwinkle and coral accents, expressive display type, and four distinct people/colours have been explored. Retain what genuinely serves Planic; challenge it if reference research and prototyping reveal a stronger coherent direction. Do not reflexively use warm cream, purple gradients, cards, rounded panels, phone mockups, pills or a “modern SaaS” layout.

---

## 2. Resource map — what each source is for

### A. Design references and visual research

| Resource | Use it for | How to use it well | Caution/status |
|---|---|---|---|
| **Refero Styles** — https://styles.refero.design/ | Searchable real-product visual systems; typography, palette, surface, spacing and layout. Its `DESIGN.md` pages can be fed to coding agents. | Inspect a small number of varied references. Extract specific principles, then rewrite them for Planic. A reference supplies visual context, not the product behaviour or identity. | Public DESIGN.md content is a good starting point. Images/previews may be blocked by a particular environment. Do not claim visual inspection if only text loaded. Refero MCP is optional, not a prerequisite. |
| **Recent** — https://recent.design/ | A gallery for discovering current website design references. | Find concrete candidate pages; then inspect the actual page or screenshots, not just gallery thumbnails. | In prior captures, the gallery shell loaded but thumbnails/data did not. Verify access in the current session. |
| **Godly** — https://godly.design/ (also previously attempted `godly.website`) | Website discovery / inspiration candidate. | Verify the current destination and whether it offers distinct value over Recent before investing time. | A previous environment could not load it; redirect relationship to Recent was not verified. Don't assume the domains are interchangeable. |
| **The Pudding** — https://pudding.cool/ and https://pudding.cool/process/responsive-scrollytelling/ | Narrative-led, interactive stories; how a visual explanation unfolds through reading, scrolling and responsive layouts. | Study the story mechanic, pacing, information order and small-screen adaptation. Borrow one mechanism, not the whole style. | This is a storytelling reference, not a component library or a general-purpose UI design system. A prior session visually captured the home page and two stories; access may differ by session. |
| **Stripe Press** — https://press.stripe.com/ | Editorial design, typography, long-form hierarchy and restrained composition. | Use to study type, rhythm and information design if the page renders correctly. | A prior environment showed an unstyled page because CSS/assets were blocked. Do not describe its visual design from that capture alone. |
| **Auteur live gallery** — https://agiwhitelist.github.io/auteur/ | Examples of high-ambition interaction: cursor-reactive particle wordmarks, WebGL scenes, kinetic typography, scroll-directed/asset-driven experiences. | Study actual interaction mechanics and how the idea connects to the subject. Ask: what is the visitor doing, what changes, and why does that change make sense? | Benchmark for craft, not the target identity. Do not use its visual look or pipeline as the default for Planic. |
| **Auteur source repository** — https://github.com/agiwhitelist/auteur | Optional inspectable Claude Code skill and workflow: research, art direction before code, storyboard, asset sourcing, anti-template checks, screenshot and motion QA. | Audit `SKILL.md`, relevant reference files, scripts and permissions in a separate workspace. Borrow only the process components that fit. | MIT-licensed project per its repository, but inspect scripts and network/tool behaviour before installing/running. Optional media CLIs may not be available. No automatic installation or forced `direct` workflow. |
| **User-supplied reels, videos, screenshots and websites from this conversation** | First-hand references selected by the founder; often the best evidence for the precise motion or emotional quality requested. | Maintain an index with the source, timestamp/frame, observed mechanic, intended lesson, what not to copy, and possible Planic application. Re-open the supplied media rather than relying on captions. | If a reel or site can't be accessed, ask for a screen recording or inspect provided screenshots. Don't infer unobserved motion from a cover image. |

### B. Claude Code skills and plugins

| Resource | Use it for | Recommended treatment |
|---|---|---|
| **Anthropic Frontend Design plugin** — https://claude.com/plugins/frontend-design | Frontend visual direction and implementation: distinctive typography, colour, composition, motion, and avoiding generic generated interfaces. | **High priority for implementation**, if available/enabled in this Claude Code environment. Verify actual activation; account/plugin availability varies. It supports judgement; it doesn't replace reference research or Planic's brief. |
| **UI/UX Pro Max** — https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | Searchable design guidance across styles, palettes, type pairings, UX guidance and tech stacks. Can help compare options and retrieve focused guidance. | **Evaluate, don't blindly apply.** The public repo identifies an MIT license and a Claude Code skill, but confirm current version/install command and inspect scripts first. Avoid importing generic preset combinations as the art direction. |
| **Refactoring UI skill/source** — https://github.com/wondelai/skills (look for `refactoring-ui`) | After a direction exists, critique hierarchy, spacing, contrast, typography, visual weight and clarity. | Later refinement/review. It must not “tidy” a deliberately expressive concept back into uniform cards. Check availability in Claude's plugin catalogue; don't assume it's listed. |
| **UX Heuristics skill/source** — https://github.com/wondelai/skills (look for `ux-heuristics`) | Independent usability review using established heuristics; identify confusing behaviour and severity-ranked issues. | Use after a working prototype exists. It is a reviewer, not an art director. Inspect the actual `SKILL.md`; catalogue availability previously wasn't confirmed. |
| **Design Sprint skill/source** — https://github.com/wondelai/skills (look for `design-sprint`) | Structured problem framing, concept selection, prototype and user-test planning. | Use only if a real unresolved product question warrants it. Don't run a five-day process to decide a simple animation. |
| **Hooked UX skill/source** — https://github.com/wondelai/skills (look for `hooked-ux`) | Habit-loop/retention analysis. | Not relevant to the current landing-page art direction. Revisit for product retention later, with ethical attention to user autonomy. |
| **iOS HIG Design skill/source** — https://github.com/wondelai/skills (look for `ios-hig-design`) | Native Apple interface conventions, gestures, navigation, safe areas and accessibility. | Defer to native iOS app design. Not a reason to make the marketing site look like iOS. |
| **Anthropic Design plugin (Cowork)** — https://claude.com/plugins/design | Design critique, UX writing, accessibility audits, research synthesis and design handoff. | Potentially useful if the work moves into Cowork/design-research tasks. Check its supported host; do not assume it functions like a Claude Code plugin. |

### C. Component, interaction and animation resources

| Resource | Best utility | Stack/decision caveat |
|---|---|---|
| **GSAP + ScrollTrigger** — https://gsap.com/ | Complex choreographed motion, scroll-triggered scenes, timelines and coordinated transitions. GSAP's own repository currently says the full toolset is free, including bonus plugins. | Strong candidate if the chosen concept actually needs a coordinated timeline. Add only after a small proof. Test accessibility, reduced motion and mobile performance. Don't add Lenis/smooth scrolling automatically; native scrolling may be better. |
| **React Bits** — https://www.reactbits.dev/ and https://github.com/DavidHDev/react-bits | Discover animated text, cursor/mouse effects, backgrounds and microinteraction techniques. | Primarily React-oriented. Public repo describes MIT + Commons Clause: commercial use is allowed under its terms, but components themselves can't be sold/redistributed standalone. Check the exact license for the chosen component. Adapt the idea to current stack if useful; do not migrate solely to install it. |
| **21st.dev** — https://21st.dev/ and https://mcp.21st.dev/mcp | Search and install components through an agent workflow. | React/Tailwind-oriented; prior review indicated the MCP needs an API key/paid access. Verify current terms. Use only if the selected implementation actually benefits. No account setup by default. |
| **Uiverse** — https://uiverse.io/ and community archive https://github.com/HerveMucyo/uiverse | Individual CSS/Tailwind controls, hover effects and small UI details. | Community-created: review each element's quality, source and license. The public archive describes elements as MIT-licensed; verify the specific version/asset. Use for a useful detail, not as the page's design system. |
| **Aceternity UI** — https://ui.aceternity.com/ | React/Next.js/Tailwind/Motion components, including effects and animated page sections. | Many components require a React-oriented stack; paid blocks/templates exist. Inspect the exact component's license/price. Inspiration-first unless the architecture decision supports direct use. |
| **CSS/SVG/Canvas/WebGL/Three.js** | Different implementation levels for responsive cursor effects, particle/field interactions, generative graphics, kinetic type, state morphs and immersive visuals. | These are techniques/technologies, not a mandate. Prototype the simplest version that achieves the intended effect; choose WebGL/Three.js only when its visual payoff justifies accessibility, performance and complexity costs. |
| **Optional asset tools referenced by Auteur** — Blender, FFmpeg, image/video-generation CLIs such as Codex/Grok/other local tools | Create or transform custom visuals, 3D assets, short video and optimized media. | Availability is environment-specific. Check what's actually installed and authorized. Record asset sources, licenses, file sizes and fallback. Never invent access or use paid APIs without approval. |

### D. Testing and proof

| Tool | Utility | Acceptance use |
|---|---|---|
| **Playwright** — https://playwright.dev/docs/screenshots | Real browser automation, viewport/full-page/element screenshots and interaction checks. | Use on the actual prototype at desktop and mobile sizes; test cursor/touch/keyboard, every important state, resize, no-JS, reduced motion, form/nav, console errors and horizontal overflow. Screenshot evidence is necessary but not sufficient. |
| **Chromium + CPU/network throttling where available** | Performance and interaction validation. | Separate headless diagnostics from real-GPU performance claims. Measure production build where possible. Report actual settings and results; don't invent a frame-rate figure. |
| **Manual real-device/browser checks** | Find touch, Safari/Firefox rendering, viewport, focus, screen reader and device performance issues. | Still required before release; headless Chromium cannot prove cross-browser/device correctness. |
| **Auteur `slopscan` / `motionqa` / `systemscan` scripts** | Optional inspiration for repeatable anti-template, motion and cross-screen quality gates. | Inspect scripts and adapt only useful, understandable checks. Don't install/run unreviewed code blindly, and don't let a regex linter dictate creative taste. |

---

## 3. Priority by stage — not an installation checklist

### Stage 0: Discover and understand
- Read product context, current docs, latest concept board and all founder-supplied visual references.
- Verify current branch/PR state and the actual environment capabilities.
- Use Refero Styles, Recent/Godly where accessible, The Pudding, Stripe Press, Auteur's live examples and broader curated examples to find mechanisms and principles.
- Ask for a screenshot or screen recording only when a relevant reference truly cannot be inspected; don't ask the founder to resend material already in the conversation.

### Stage 1: Decide what experience to create
- Use product reasoning and optionally a bounded design-sprint method if there is a real question to test.
- Research interactive patterns: pointer/touch manipulation, responsive kinetic type, generative visuals, stateful product demonstrations, scrollytelling, scene transitions, and other mechanisms found in references.
- Specify what the visitor should feel, understand and *do*.
- Select a primary “wow” interaction and supporting interactions. The primary moment must express Planic's purpose, not simply show off a shader.
- Write a Planic-specific brief/storyboard/design specification before implementation. Do not use Auteur's design style or workflow by default.

### Stage 2: Prototype the experience
- Use Frontend Design if enabled; use UI/UX Pro Max only for focused searches where it adds knowledge beyond the other sources.
- Select CSS/SVG/Canvas/GSAP/WebGL/Three.js based on the chosen interaction—not the other way round.
- Reuse or adapt an existing component only if it improves the result and passes stack/license/quality checks.
- Build one meaningful working prototype in an isolated branch/worktree. Do not redesign the whole site before the central interaction is proven.

### Stage 3: Review and refine
- Playwright screenshots for first view, important states and full page at mobile and desktop sizes.
- Critique originality, narrative, usability, accessibility and actual emotional impact—not only visual cleanliness.
- Use UX Heuristics/Refactoring UI after a concept exists, not as the source of the concept.
- Test reduced motion, keyboard, touch, screen-reader semantics, loading/fallback, performance and errors.
- Only then decide whether to adopt a new framework or rebuild the website fully.

### Stage 4: Build the full site and release
- Create/lock Planic's own `DESIGN.md` and interaction contract based on the approved concept, not a copied reference file.
- Implement the rest of the narrative with visual rhythm; don't repeat the hero's trick in every section.
- Validate mobile and desktop, actual browser/device coverage, early-access form and deployment preview.
- Keep PR #3 paused and untouched until the founder explicitly decides what to do with it. Use a separate branch/worktree for any approved ground-up experiment.

---

## 4. Tool selection rules

For every proposed tool, skill, library or asset source, answer:
1. What concrete problem does it solve in the chosen experience?
2. What evidence says it can solve that problem?
3. Is it actually available in the current environment, and was its relevant page/demo visually inspected or only read as text?
4. Is it compatible with the proposed stack? If not, why is a stack change worth it?
5. What are its license, cost, external requests, permissions, dependency/asset weight, performance and maintenance implications?
6. Is it better to reuse directly, adapt conceptually, study as inspiration or reject?
7. What proof will show it improved the result?

Never install a tool because it appears in this list. Never claim visual inspection if only text loaded. Never treat a screenshot as evidence of interaction quality. Never use more tools than needed, but don't reject a powerful tool purely to preserve the current stack if a new architecture can be justified by a working prototype.

Do not run external install commands or third-party scripts without reviewing the source, expected side effects and permissions. No destructive repository operations, remote deletion, merges or production deployment without explicit approval.

---

## 5. Master prompt for Claude Code

Copy the prompt below into the existing Planic design-planning thread, together with this file. It is intentionally designed to encourage independent thinking rather than force a particular concept or tool.

> You are working with me on Planic's marketing website. Read `PLANIC_DESIGN_TOOLKIT_AND_RESEARCH_PROMPT.md` in full before continuing. Treat it as context and a resource index, not a rigid recipe.
>
> **The actual goal:** create an exceptional, living, responsive web experience that makes visitors feel Planic's product philosophy. Planic helps groups transform different human intentions and constraints into one concrete plan. The website should not merely explain this process; it should let a visitor experience and influence some meaningful part of it. Cursor, hover, drag, touch, keyboard, scroll, kinetic typography, generative graphics, Canvas/WebGL, custom assets, sound or other techniques are all candidates, but none is mandatory.
>
> I have been dissatisfied with the earlier static and card-heavy concepts: Marginalia, The Overlap, Convergence and Four Pens. Those are research artefacts, not design constraints. You have freedom to redesign from scratch if evidence supports it. Do not default to a SaaS layout, UI-card grids, pill chips, floating phone mockups, generic gradients, or a familiar animation simply because that is easy to generate.
>
> Auteur is an example of the interaction quality that inspired me, especially how a cursor can make the visual world respond. It is a benchmark only. Do not copy its appearance, signature effects or workflow by default. Find an experience that is recognisably Planic and derive its visual language from the product's own purpose.
>
> **Use the toolkit by utility:**
> - Use Refero Styles, Recent/Godly, The Pudding, Stripe Press, Auteur examples and the references I have already supplied to research real visual and interaction techniques. Verify accessibility; distinguish pages viewed visually from sources read as text.
> - Check whether Frontend Design is enabled. Consider UI/UX Pro Max for focused design-system searches if it adds value. Avoid overlapping skills without a clear reason.
> - Investigate GSAP/ScrollTrigger, React Bits, 21st.dev, Uiverse, Aceternity UI, CSS/SVG/Canvas/WebGL/Three.js and asset tools only when a specific technique merits evaluation. For each selected item, check source, license, compatibility, cost, dependencies, permissions and performance. Do not migrate stacks just to consume a library, but don't treat the current stack as sacred either.
> - Use Playwright screenshots and interaction tests to inspect your real prototype at desktop and mobile sizes. Test important states, direct manipulation, keyboard/touch equivalence, reduced motion, no-JS fallback, console errors and performance where tools permit.
> - Refer to the UX heuristics and Refactoring UI resources for critique once a prototype exists, not as templates that dictate the art direction. iOS HIG is for the future native app; Hooked UX is not relevant to this landing-page task unless a specific retention question arises.
>
> **Product truths:** the product is group-first and intended to be voice-first; New Delhi is the initial geography; recommendations should be based on the group's real preferences and constraints, with understandable reasons and honest trade-offs. Google Places may supply data but is not the recommendation engine. Do not imply unfinished features are live. Use one consistent illustrative scenario if needed and label it honestly. Preserve useful copy, brand assets, form behaviour and technical work where valuable, but do not preserve existing page layout just because it exists.
>
> **Work in phases; don't skip straight to code:**
> 1. Audit the current state, branch/PR, docs, assets and the tools actually available in this environment. Do not assume installations, authentication, visual browser access or skills that are not verified.
> 2. Run a bounded reference investigation. Aim for a small set of high-value references. Record the exact mechanism learned from each, what not to copy, and where it could serve Planic.
> 3. Propose the strongest experience concept based on Planic's philosophy. Explain the visitor's emotional/interaction arc, the one primary memorable moment, and what the visitor can genuinely manipulate. Challenge the concept's cliché risks.
> 4. Build a complete enough working prototype of the key experience to test the idea. You may use a separate branch or worktree. Do not implement the whole website yet. Do not install a large dependency, paid service or framework without a clear rationale and my approval.
> 5. Capture real desktop and mobile renders and show how the interaction responds. Report the tests actually run and all coverage gaps. If a site is blocked, find another route or ask for a screenshot; don't claim an inspection that did not happen.
> 6. Pause for my review before full implementation. Do not merge PR #3, delete or overwrite the repository, or deploy to production.
>
> Be independent and critical. Do not agree with my latest suggestion automatically. Do not substitute another static moodboard for a working interaction. Don't maximise the number of tools; maximise the value of the decisions they enable. If the best answer requires starting over, make the case with evidence and demonstrate it safely in isolation.
>
> **Standard of success:** a memorable, responsive, interactive experience whose motion and visuals are inseparable from Planic's purpose; strong visual authorship rather than a familiar AI-generated template; credible behaviour; and engineering quality that stands up to real browser and device testing. Show me a working result, not merely a description of one.

---

## 6. Suggested reference links (direct)

- Refero Styles library: https://styles.refero.design/
- Refero `DESIGN.md` guide: https://styles.refero.design/design-md/design-md-for-claude-code
- Refero prompts for Claude Code: https://styles.refero.design/ai-agents/claude-code-design-prompts
- Frontend Design (Anthropic): https://claude.com/plugins/frontend-design
- Auteur repository: https://github.com/agiwhitelist/auteur
- Auteur live gallery: https://agiwhitelist.github.io/auteur/
- Recent: https://recent.design/
- Godly: https://godly.design/
- The Pudding scrollytelling guide: https://pudding.cool/process/responsive-scrollytelling/
- Stripe Press: https://press.stripe.com/
- React Bits: https://www.reactbits.dev/
- 21st.dev: https://21st.dev/
- Uiverse: https://uiverse.io/
- Aceternity UI: https://ui.aceternity.com/
- GSAP: https://gsap.com/
- Playwright screenshot docs: https://playwright.dev/docs/screenshots
- UI/UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Agent skills collection (Refactoring UI, UX Heuristics, Hooked UX, Design Sprint, iOS HIG, among others): https://github.com/wondelai/skills
