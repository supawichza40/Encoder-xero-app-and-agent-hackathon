# PayoutBridge — 8-Second Hero Video Prompts (for Gemini / Veo) · built by Supavich

Ambient background loops to make the app feel like a real, polished product. Paste any prompt below into **Gemini (Veo)** — Gemini app video generation, Google AI Studio, or Flow. Each is an **8-second seamless loop**, muted, abstract.

---

## READ FIRST — the rules that stop this looking fake

1. **Abstract only. NO readable text, numbers, UI, charts, logos, or the words "Xero"/"PayoutBridge"/"Treatwell" in the video.** Veo garbles text and fabricates numbers — a wrong £ figure in a financial app judged by accountants is fatal. The video is *atmosphere*, not a screenshot.
2. **Where it goes:** behind the **idle / landing / upload screen only** — the first thing judges see, before the live demo. It NEVER plays during the golden-path demo (that's the real Xero writes). It's decorative, so it can't misrepresent data.
3. **Muted autoplay loop.** Web hero video is always silent (`muted` + `loop` + `playsinline`). Ignore any audio Veo adds — the `<video>` tag mutes it.
4. **Seamless loop:** the last frame must return to the first. Every prompt below ends by drifting back to its opening state so it loops without a jump.
5. **Two themes:** we default light, toggle dark (see design-references.md). Generate **two versions** of your chosen concept — one on a **white background** (`#ffffff`) for light mode, one on **dark navy** (`#0f172a`) for dark mode — and swap by CSS. Or generate one neutral version and dim it under a panel.

**Technical spec to request:** 8 seconds · 16:9 (1920×1080) · smooth 24–30fps · cinematic, shallow depth of field · minimal · slow, calm motion · no text · seamless loop.

---

## CONCEPT 1 — "Clearing to Zero" (RECOMMENDED)

**Metaphor:** messy money streams converge and balance to one clean line = the clearing account hitting £0.00. Most abstract, most premium, safest.

**Frame-by-frame (8s):**
- **0.0–1.0s** — Empty navy (or white) space, faint dot-grid. Three thin luminous streams (blue, green, amber) drift in from the left edge, slightly chaotic, fine particle trails.
- **1.0–2.5s** — Streams braid toward centre; slow camera push-in (dolly); soft bokeh particles float.
- **2.5–4.0s** — The three streams merge into ONE bright horizontal line at centre; small particles orbit it.
- **4.0–5.5s** — The line pulses once and smooths perfectly flat/level; a soft **green** glow blooms along it (the "balanced" beat).
- **5.5–7.0s** — Glow settles; particles dissipate gently outward; the line holds, calm.
- **7.0–8.0s** — Elements drift back toward the chaotic edge state and fade to match frame 0 (seamless loop).

**Paste to Gemini (light version):**
```
An elegant minimalist financial motion graphic, 8 seconds, seamless loop. On a clean pure-white background with a very faint dot grid, three thin luminous ribbons of light — soft blue, soft green, soft amber — drift in from the left edge with delicate particle trails. Over the first few seconds a slow gentle camera push-in follows them as they braid toward the centre and merge into a single bright horizontal line of light. The line pulses once and settles perfectly flat and level, and a soft green glow blooms gently along it. Particles dissipate outward and the scene calmly drifts back to its opening state so it loops seamlessly. Shallow depth of field, soft bokeh, premium fintech aesthetic, calm and precise, cinematic, no text, no numbers, no user interface, no logos.
```
**Dark version:** same prompt, replace "clean pure-white background" with **"deep dark navy background (#0f172a)"** and add "the light ribbons glow brighter against the dark."

---

## CONCEPT 2 — "Books Aligning" (messy → correct)

**Metaphor:** tangled, uneven ledger bars resolve into clean aligned rows = wrong books becoming right books. Tells our exact story.

**Frame-by-frame (8s):**
- **0.0–1.0s** — Clean surface; a cluster of short horizontal bars of varying lengths, slightly skewed and misaligned, muted grey.
- **1.0–2.5s** — Bars jitter softly; a gentle blue sweep of light passes left → right (a "scan").
- **2.5–4.0s** — As the sweep passes each bar, the bars snap into neat alignment — equal spacing, edges locking to an invisible grid.
- **4.0–5.5s** — One bar highlights **green** and extends to meet a target line; a soft arc of light traces above it (abstract "reconciled" beat — NOT a literal tick).
- **5.5–7.0s** — The whole set glows faint green, settles, breathes once.
- **7.0–8.0s** — Colour fades back to muted grey and slight misalignment to loop.

**Paste to Gemini (light version):**
```
A clean minimalist motion graphic, 8 seconds, seamless loop. On a soft white background, a group of short horizontal bars sits slightly misaligned and muted grey, casting gentle soft shadows. A smooth blue sweep of light passes from left to right, and as it passes, the bars glide into perfect alignment with even spacing, snapping to an invisible grid. One bar then highlights soft green and extends to meet a guide line as a faint arc of light traces above it. The whole set glows a gentle green and breathes, then fades back to muted grey and slight misalignment so it loops seamlessly. Premium accounting-software aesthetic, precise, calm, soft shadows, shallow depth of field, no text, no numbers, no user interface, no logos.
```
**Dark version:** replace "soft white background" with **"dark navy background (#0f172a)"**, "muted grey bars" → "muted slate bars", brighter glows.

---

## CONCEPT 3 — "Settle to Level" (balance)

**Metaphor:** luminous liquid-light fills a minimal channel then settles perfectly level = balancing to zero.

**Frame-by-frame (8s):**
- **0.0–1.0s** — A shallow, minimal transparent channel/vessel, empty, soft rim light.
- **1.0–3.0s** — Luminous liquid-light pours in from the top-left, swirling, turbulent.
- **3.0–5.0s** — The liquid rises and its motion begins to calm.
- **5.0–6.5s** — The surface settles perfectly flat/level; a thin **green** line marks the exact level with a soft glow.
- **6.5–8.0s** — A gentle ripple recedes and the light drains slightly back toward empty to loop.

**Paste to Gemini (light version):**
```
An elegant fintech motion graphic, 8 seconds, seamless loop. On a soft white background, luminous blue liquid light pours from the top-left into a minimal shallow glass channel, swirling gently. The liquid rises and its motion calms until the surface settles perfectly flat and level. A thin soft-green line marks the exact level with a gentle glow. A subtle ripple recedes and the light drains slightly back toward empty so the clip loops seamlessly. Shallow depth of field, soft caustics, premium, calm, refined, no text, no numbers, no user interface, no logos.
```
**Dark version:** "soft white background" → **"dark navy background (#0f172a)"**.

---

## CONCEPT 4 — "Payment Path" (ambient tech, bonus)

**Metaphor:** a single payment travels from a marketplace node into an organised ledger grid.

**Frame-by-frame (8s):**
- **0.0–1.0s** — Sparse network of soft glowing nodes on a clean field; one node on the left brightens.
- **1.0–3.0s** — A bright pulse detaches from the left node and travels along a smooth curved luminous path.
- **3.0–5.0s** — It arrives at a structured grid on the right, which lights up row by row in sequence.
- **5.0–6.5s** — The grid completes; a soft **green** wash confirms.
- **6.5–8.0s** — The pulse fades and the network returns to rest to loop.

**Paste to Gemini (light version):**
```
A refined minimalist tech motion graphic, 8 seconds, seamless loop. On a soft white background, a sparse network of gently glowing nodes floats in clean space. One node on the left brightens and releases a bright pulse of light that travels smoothly along a curved luminous path to a neat structured grid on the right, which illuminates row by row in sequence and settles into a soft green wash. The pulse fades and the network calmly returns to rest so the clip loops seamlessly. Elegant, premium fintech, shallow depth of field, soft glow, no text, no numbers, no user interface, no logos.
```
**Dark version:** white → **dark navy (#0f172a)**.

---

## Where + how to generate

- **Gemini app** (Gemini Advanced → video / Veo), **Google AI Studio** (Veo model), or **Google Flow**. Paste the prompt, set **aspect 16:9**, **8 seconds**. Veo 3 may add audio — ignore it (the web `<video muted>` silences it).
- Generate **2–3 tries per concept** (video gen is non-deterministic); keep the one that loops cleanest.
- Export **MP4**. Then make a **WebM (VP9)** copy too (smaller for web) and a **poster JPG** (first frame) — optional but professional.

## How to put it in the page (idle/hero only)

```html
<div class="hero-media">
  <video class="hero-video" autoplay muted loop playsinline poster="/hero-poster.jpg">
    <source src="/hero.webm" type="video/webm">
    <source src="/hero.mp4"  type="video/mp4">
  </video>
  <div class="hero-overlay"></div>   <!-- gradient so text stays readable -->
  <!-- upload zone / headline sits on top -->
</div>
```
```css
.hero-media{ position:relative; overflow:hidden; }
.hero-video{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.55; }
.hero-overlay{ position:absolute; inset:0; background:linear-gradient(180deg, rgba(255,255,255,.2), rgba(255,255,255,.85)); } /* dark theme: swap to navy rgba */
@media (prefers-reduced-motion: reduce){ .hero-video{ display:none; } } /* poster shows instead */
```
- Keep it **behind** content at ~50–60% opacity with the overlay — it's texture, not the star. The live **£0.00** is still the hero.
- Only on the **idle/upload screen**. Remove/hide it once the demo flow starts.
- Ship the **poster image** as fallback (reduced-motion users + if the video fails to load) so it never looks broken on stage.

## Recommendation
**Concept 1 (Clearing to Zero)** — most premium and abstract, directly encodes "balance to zero" with zero risk of fake text. **Concept 2 (Books Aligning)** is the best storytelling second choice. Generate both, pick on the projector.
