# ZERO DRIFT
### Ghost Encoding Lens - Interactive Fiction Reader

> *"The question doesn't have a final answer. That's the point."*

---

## What This Is

**ZERO DRIFT** is an atmospheric interactive fiction reader built around a single central mechanic: text is hidden. You move your cursor across the screen to decrypt it as if scanning a corrupted signal with a lens. The story reveals itself only where you look.

It is a near-future noir novel. Thirty chapters. Multiple perspectives. One cold case that turns out to be much larger than a cold case.

**This project was built entirely by Claude (Anthropic's AI).** I came up with the concept and designed the visual direction. Claude wrote the novel, every line of code, every CSS rule, every piece of atmospheric detail. This was an experiment I wanted to see how far you could push an AI to build something that felt genuinely crafted rather than generated.

The answer, apparently, is pretty far.

---

## The Mechanic

On desktop, the screen is dark. A radial gradient overlay hides all the text except inside a circular "lens" that follows your cursor. Move the cursor to read. The lens radius is adjustable via a slider. Leave the cursor still for three seconds and the lens slowly contracts the signal decays without active attention.

On mobile, paragraphs reveal automatically as you scroll into them.

The waveform running across the bottom of the screen is the story's progress. The left section decoded is bright. The right section 'unread' is dim. It fills as you move through the chapters.

---

## The Story

**Setting:** Velthan, a coastal city. 2051. The near future, recognizable enough to feel immediate.

**The premise:** Detective Calder Voss is assigned a cold case the death of Dr. Elias Thren, an independent physicist who worked alone in a converted marine research station on the coast. The original ruling was cardiac event, natural causes. The file was thin. Nobody had looked carefully.

Voss looks carefully.

What he finds is that Thren's equipment ran for six hours after he died. That the pathology report contains a trace compound - synthetic, purpose-designed that mimics cardiac failure in someone with a pre-existing irregularity. That five months of records are missing. That someone sent Voss the equipment logs within hours of his first visit to the lab.

Someone knew he would come. Someone had been waiting.

**What Thren was actually building:** A gravitational wave detection array of extraordinary sensitivity twelve times beyond the institutional benchmark capable of receiving transmissions that travel backward through the gravitational medium. From the future. Thren had been receiving fragments of a signal for years. When he realized what it was, and what it meant, he built a deadman mechanism: if he died, the array would activate automatically, archive everything, and begin broadcasting forward. His death would become the transmission.

**The Meridian:** The organization that had Thren killed. Founded thirty years prior with a stated purpose prevention of civilizational cascade through timeline intervention and correction. Their doctrine: Zero Drift, the elimination of variance. They managed cities, transferred detectives, buried analyses, maintained control. They believed that reducing uncertainty was the same as reducing harm.

They were wrong. Their own buried internal analysis showed that Meridian interventions had increased the severity of target cascades by approximately thirty percent. They had been making everything worse while believing they were making everything better. The analysis was commissioned by their director. Then buried by their director.

Thren found it. That is why he was killed.

**The broadcast:** Before he died, Thren packaged everything the signal fragments, the self-causation analysis, the evidence of Meridian's actions and sent it forward. The broadcast is now in the interstellar medium, moving at the speed of light. It will arrive. Eighty years from now, someone named Wren will receive it, and will do with it what needs to be done.

**The cast:**

- **Calder Voss** - Detective, Cold Review Division. Careful, deliberate, not given to conclusions he hasn't earned. The unmodeled variable the Meridian never accounted for.
- **Nara Osei** - Thren's last research assistant. Continues his work at the array. Has been waiting six months for someone to pull the equipment logs.
- **Sable Morrow** - Meridian operative assigned to monitor and if necessary close the investigation. Finds, over the course of the story, that she cannot.
- **Juni Cross** - Journalist. Compromised, then not. Her chapter voices have a particular instability built into the text itself.
- **Elias Thren** - Present throughout, though dead before the first page. His signal is everywhere.
- **Wren** - Eighty years forward. The endpoint of everything Thren set in motion.

**The themes:** What do you choose when you can't choose certainty? The Meridian's answer was control certainty imposed, variance eliminated, outcomes managed. The story's answer is different: honest relationship with what cannot be known, forward movement through uncertainty, the specific small choices that accumulate into a life. The title is the Meridian's doctrine. The story dismantles it.

---

## Features

| Feature | Description |
|---|---|
| **Decryption Lens** | Radial gradient overlay follows cursor. Text visible only inside the lens circle. |
| **Adjustable Radius** | Slider in the sidebar controls lens size (80px – 420px). |
| **Signal Quality System** | Each chapter has a signal level (0–100). Lower signal = corrupted characters in the text. The header bar animates between chapters. |
| **Waveform Progress** | Canvas-drawn waveform at the bottom splits at your reading position — decoded left, undecoded right. |
| **POV Color Modes** | Four viewpoint characters each have a distinct color palette applied to the text and lens rim. |
| **Ghost Signal Events** | Chapters 7, 16, and 21 trigger a full-screen ghost overlay, waveform spike, screen shake, and lens flicker. |
| **Meridian Terminal** | Type `connect meridian` anywhere on the page (or `Ctrl + `` ` ``) to open a hidden command-line interface. Accepts ~20 lore commands. |
| **Velthan Array Map** | SVG map of the story's locations, drawn entirely in JavaScript. Click locations to decrypt their dossier files. |
| **Case File Mode** | Transforms the reading area into a physical document — aged paper texture, hole punches, margin annotations, classification stamps. |
| **Act Timeline Sidebar** | Chapter navigation structured as an act timeline with POV dots and signal spike markers. |
| **Konami Code** | ↑ ↑ ↓ ↓ ← → ← → B A — expands the lens to full screen for 12 seconds. |
| **Dead Coffee Maker** | A pure CSS illustration in the corner. Glows orange throughout. Goes dark on chapter 30. |
| **Mobile Scroll Reveal** | On touch devices, paragraphs reveal automatically as you scroll into them. |
| **Gyroscope Support** | On supported mobile devices, tilting the phone moves the lens position. |

---

## Tech Stack

Vanilla everything.

- **HTML / CSS / JavaScript** - no frameworks, no build tools, no dependencies
- **JetBrains Mono** - the only external resource (Google Fonts)
- **Canvas API** - grain texture and waveform animation
- **CSS custom properties** - the lens mechanic runs entirely on `--cx`, `--cy`, and `--radius` updated on every `mousemove`
- **IntersectionObserver** - mobile scroll reveal
- **SVG** - map drawn programmatically in `map.js`, no image files

## The Experiment

I built this to test what Claude could actually do when given a concept and left to execute.

The brief was: an interactive fiction reader with a decryption lens mechanic, dark terminal aesthetic, a story set in the near future involving a cold case and some kind of signal from the future. I designed the visual direction — the monospace palette, the green-on-black signal aesthetic, the atmosphere I wanted. Claude did everything else.

The novel is approximately 85,000 words across thirty chapters. The code is around 3,500 lines. The CSS is another 2,000+. None of it was copy-pasted from templates. All of it was written through conversation - I'd describe what I wanted, Claude would build it, I'd iterate on what wasn't right.

The things that surprised me most:

- The prose quality. It reads like a novel, not like generated text.
- The coherence across thirty chapters character arcs, planted details, payoffs in later chapters for things set up early.

Whether this is impressive or unsettling probably depends on who you are.

---

## Credits

**Concept & Design** — me  
**Story & Code** — [Claude](https://claude.ai) (Anthropic)

---

*The broadcast is in the interstellar medium. It will arrive.*
