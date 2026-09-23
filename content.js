/* ============================================================
   TECHNICAL BINDER — CONTENT
   ------------------------------------------------------------
   This is the only file most people need to touch.
   It is plain JSON wrapped in one line of JavaScript so the site
   works when you just double-click index.html (no web server).

   Rules:
     - Every section needs: id, category, title, thesis
     - "thesis" is the one-line summary shown under the title
     - Set "print: false" on a section to leave it out of print.html
       (e.g. a video-only section with nothing worth putting on paper)
     - "features" is an optional bullet list; leave [] to hide it
     - "media" is a list of blocks, rendered top to bottom. Every
       block type below can take an optional "label" — it prints
       as a small heading above the block (e.g. "Prototyping").
     - In any text you can use **bold** and `code`
   ============================================================ */

window.BINDER_CONTENT = {

  team: {
    number: "6996",
    name: "Koalafied",
    season: "2026",
    robot: "LEMON LAUNCHER",
    tagline: "Full-width slap-down intake feeding a spindexer hopper, into a 360° turreted shooter. And an L1 climb.",
    accent: "#0a7770",
    // Swaps one letter of `robot` for a picture, on the hero and the print
    // cover — here, the O in LEMON becomes a lemon slice. `at` picks which
    // occurrence when the letter appears more than once. Delete this line and
    // the name renders as plain text.
    robotGlyph: { letter: "O", at: 1, src: "assets/img/lemon-half.svg" },
    logo: "assets/img/logo.svg",
    // Optional split of `logo` for the nav mark: the sprocket ring on its own
    // and everything else. When both are set the nav stacks them and turns the
    // ring with the page scroll. Regenerate with scripts/split-logo.py; drop
    // either one and the nav falls back to the single `logo` above.
    logoGear: "assets/img/logo-gear.svg",
    logoCore: "assets/img/logo-core.svg",
    website: "https://teamkoalafied.com",
    cad: "https://cad.onshape.com/documents/f777e2d9e964fbf60835e3da/w/235a7544344677d127d5777e/e/62d9f4aee1b8ab6f94113ccb"
  },

  hero: {
    image: "assets/img/hero-robot.webp",
    alt: "Full robot assembly, isometric view (placeholder)",
    // Each callout can carry an optional `hl` (same camera as `image` above,
    // that one system left solid). When present, hovering (or focusing) the
    // callout's rail label crossfades the hero image to it — same mechanism
    // as a section's Main View, just triggered by hover. Omit `hl` and the
    // callout is just a label, no highlight.
    callouts: [
      { id: "shooter",   side: "left",  x: 45, y: 26, blurb: "Two flywheel motors for recovery time, packaged inside the turret diameter.",
        hl: { src: "assets/img/hero-hl-shooter.webp", alt: "Full robot with the shooter highlighted (placeholder)" } },
      { id: "intake",    side: "left",  x: 25, y: 51, blurb: "Full-width linear intake, over the bumper.",
        hl: { src: "assets/img/hero-hl-intake.webp", alt: "Full robot with the intake highlighted" } },
      { id: "spindexer", side: "left",  x: 55, y: 63, blurb: "2.67:1 rotating hopper at ~2200 RPM.",
        hl: { src: "assets/img/hero-hl-spindexer.webp", alt: "Full robot with the spindexer highlighted" } },
      { id: "climber",   side: "right", x: 72, y: 19, blurb: "Single stage with a mechanical anti-rollback brake.",
        hl: { src: "assets/img/hero-hl-climber.webp", alt: "Full robot with the climber highlighted" } },
      { id: "turret",    side: "right", x: 60, y: 45, blurb: "54:1 on a lazy-susan bearing, 360° of motion.",
        hl: { src: "assets/img/hero-hl-turret.webp", alt: "Full robot with the turret highlighted" } }
    ]
  },

  categories: [
    { id: "reveal", label: "Reveal" },
    { id: "mechanical", label: "Mechanical" }
  ],

  sponsors: [
    { name: "Gene Haas Foundation", logo: "assets/img/sponsors/gene-haas-foundation.png" },
    { name: "South Australia — The Defence State", logo: "assets/img/sponsors/sa-defence-state.png" },
    { name: "Pembroke School", logo: "assets/img/sponsors/pembroke.svg" },
    { name: "Australian Institute for Machine Learning", logo: "assets/img/sponsors/AIML.png" },
    { name: "REDARC", logo: "assets/img/sponsors/redarc.png" },
    { name: "Energy Exemplar", logo: "assets/img/sponsors/energy-exemplar.png" },
    { name: "C&J Accountants and Advisors", logo: "assets/img/sponsors/cj-accountants.png" },
    { name: "WHi", logo: "assets/img/sponsors/whi.png" },
    { name: "Rockwell Automation", logo: "assets/img/sponsors/rockwell-automation.svg" }
  ],

  /* ------------------------------------------------------------
     STANDARD MEDIA COMPONENTS — copy/paste starting points
     ------------------------------------------------------------

     // Main view. Give it 2+ views and pills appear to isolate
     // a sub-system; give it 1 view and it's just a plain image.
     // No `alt` here on purpose — the note is shown as visible text right
     // below the image, so a screen reader would just hear it twice.
     { type: "highlight", views: [
         { tag: "Full Assembly", src: "…", note: "…" },
         { tag: "Gearbox",       src: "…", note: "…" }
     ]}

     // Prototyping / inspiration photos AND Alternate Views — combined
     // into one fixed-height carousel with prev/next arrows. `tag` is
     // optional per item; use it to mark which images are which when you
     // mix the two (e.g. "Alternate View" vs "Prototyping").
     { type: "carousel", label: "Prototyping", items: [
         { tag: "Alternate View", src: "…", alt: "…", caption: "…" },
         { tag: "Prototyping",    src: "…", alt: "…", caption: "…" }
     ]}

     // Version slider.
     { type: "iterations", label: "Iterations", versions: [
         { tag: "V1", src: "…", alt: "…", note: "…" }
     ]}

     // Draggable before/after wipe. Used by Block Model.
     { type: "compare", label: "…", caption: "…",
         before: { src: "…", alt: "…", tag: "Before" },
         after:  { src: "…", alt: "…", tag: "After" } }

     // A plain grid of images — still available, just not used by any
     // section right now (carousel replaced its two prior uses here).
     { type: "figures", label: "…", cols: 2, items: [
         { src: "…", alt: "…", caption: "…" }
     ]}

     // Embedded YouTube video, responsive 16:9. `youtube` is just the
     // video ID (the part after "v=" or after "youtu.be/").
     { type: "video", label: "…", youtube: "dQw4w9WgXcQ", title: "…", caption: "…" }
     ------------------------------------------------------------ */

  sections: [

    {
      id: "reveal",
      category: "reveal",
      title: "Reveal Video",
      thesis: "Our season reveal.",
      features: [],
      print: false, // video has nothing to show on paper — leave it out of print.html
      media: [
        { type: "video", youtube: "NSD_GfRYMus", title: "Team 6996 Koalafied — 2026 Reveal" }
      ]
    },

    {
      id: "block-model",
      category: "mechanical",
      title: "Block Model",
      thesis: "Rough space and weight were allocated for every mechanism before a single part was detailed.",
      features: [
        { text: "Very complex packaging to maximise ball space" },
        { text: "Block model used to allocate rough space and weight for all mechanisms", children: [
          "Reduces risk of collision",
          "Ensures below legal weight",
          "Rough centre of gravity important for climb planning"
        ]}
      ],
      media: [
        { type: "compare",
          before: { src: "assets/img/block-model.webp", alt: "Block model of the robot", tag: "Block Model" },
          after:  { src: "assets/img/robot-final-cad.webp", alt: "Final detailed robot CAD", tag: "Final CAD" },
          caption: "Drag to compare the block model against the final assembly." }
      ]
    },

    {
      id: "intake",
      category: "mechanical",
      title: "Intake",
      thesis: "A full-width, over-the-bumper linear intake.",
      features: [
        { text: "Linear Intake: hopper slides out with intake to expand space to store balls" },
        { text: "Modular design: intake is replaceable seperate from gearboxes" },
        { text: "Prior design used a 'slapdown' intake style. This enabled better positioning of the motor, but limited ball capacity and had less flexibility in collisions." },
      ],
      media: [
        { type: "highlight", views: [
          { tag: "Full Assembly", src: "assets/img/intake-full.webp",
            note: "Full-width roller across the front, pivoting on the drivebase rail." },
          { tag: "Gearbox", src: "assets/img/intake-hl-gearbox.webp",
            note: "Custom gearbox, mounted off the pivot arm to keep weight low." },
          { tag: "Intake", src: "assets/img/intake-hl-roller.webp",
            note: "The roller itself — the part that actually touches the ball." }
        ]},
        { type: "carousel", label: "Prototyping", items: [
          { tag: "Prototyping", src: "assets/img/alt-linkage-design.png", caption: "Alternate linkage intake design we considered", caption: "Alt Linkage CAD"},
          { tag: "Prototyping", src: "assets/img/intake-2025.jpg", alt: "2025 Intake", caption: "Intake we built in 2025 served as inspiration" },
          { tag: "Prototyping", src: "assets/img/intake-prototype.png", alt: "Prototype intake on 2025 robot", caption: "Prototype intake attached to 2025 robot" }
        ]}
      ]
    },

    {
      id: "spindexer",
      category: "mechanical",
      title: "Spindexer & Kicker",
      thesis: "A rotating hopper that holds and singulates balls into the shooter",
      features: [
        { text: "15t to 40t, running a **2.67 : 1** reduction" },
        { text: "Balls are moved into the kicker with a spinning platform. Allows balls to fall into the spindexer more easily" },
        { text: "Old version used a large central wheel to push balls into the kicker (see prototyping pics)" }
      ],
      media: [
        { type: "highlight", views: [
          { tag: "Full Hopper", src: "assets/img/spindexer-full.webp",
            note: "The hopper walls, doubling as bumper backing, around the spindexer module." },
          { tag: "Spindexer Module", src: "assets/img/spindexer-hl-module.webp",
            note: "The rotating module itself — belt-driven, 2.67:1, ~2200 RPM." },
          { tag: "Kicker", src: "assets/img/spindexer-hl-kicker.webp",
            note: "Kicker motor, mounted to the frame above the hopper." }
        ]},
        { type: "carousel", label: "Prototyping", items: [
          { tag: "Prototyping", src: "assets/img/spindexer-prototype.png", alt: "Early version of the spindexer with the kicker attached",
            caption: "Early version of the spindexer with kicker attached" },
        ]}
      ]
    },

    {
      id: "shooter",
      category: "mechanical",
      title: "Shooter",
      thesis: "A variable hood shooter, with a camera for targeting, to shoot the fuel into the hub.",
      features: [
        { text: "2 brushless Kraken x60 motors to reduce time between shots" },
        { text: "Variable angle hood allows shots to be made from anywhere on the field." },
        { text: "JE motor for the hood: small, with a large built-in 22.2:1 reduction. Enables the small turret footprint." },
        { text: "Targeting camera is mounted directly to the shooter, giving shots greater accuracy" }
      ],
      media: [
        { type: "highlight", views: [
          { tag: "Full Assembly", src: "assets/img/shooter-main.webp",
            note: "Flywheel, feed rollers and hood, packaged inside the turret envelope." },
          { tag: "Rack & Pinion Hood", src: "assets/img/shooter-variable-hood.webp",
            note: "The hood's rack-and-pinion drive — sets launch angle independent of flywheel speed." }
        ]},
        { type: "carousel", label: "Prototyping", items: [
          { tag: "Prototyping", src: "assets/img/shooter-prototype.png", alt: "Early shooter prototype", caption: "Shooter integration test with kicker and spindexer" },
          { tag: "Prototyping", src: "assets/img/shooter-2023.png", alt: "Shooter from 2022 robot", caption: "Shooter from 2022 robot was inspiration" }
        ]}
      ]
    },

    {
      id: "turret",
      category: "mechanical",
      title: "Turret",
      thesis: "Allows targeting of the hub while on the move, anywhere on the field",
      features: [
        { text: "Modular custom gearbox design with a 54:1 reduction" },
        { text: "COTS 'lazy susan' bearing with a 3DP rack attached to drive the rotation" },
        { text: "Custom energy chain solution with spring tensioner to allow reliable >360 ROM" },
        { text: "Limit switch module is replaceable with only three screws" },
        { text: "Limit switch module has a sliding hard stop, enabling a >360 ROM with accurate software control" },
      ],
      media: [
        { type: "highlight", views: [
          { tag: "Full Assembly", src: "assets/img/turret-full.webp",
            note: "The complete ring: lazy-susan bearing, 3D-printed rack, limit switch module and drive stage." },
          { tag: "Limit Switch", src: "assets/img/turret-hl-limitswitch.webp",
            note: "Sliding hard stop. Allows >360 degrees of rotation." },
          { tag: "Gearbox", src: "assets/img/turret-hl-gearbox.webp",
            note: "Kraken drives the gearbox with an overall 54:1 ratio" },
          { tag: "Transmission", src: "assets/img/turret-hl-transmission.webp",
            note: "Turret driven by large 3D printed ring gear attached to a lazy susan bearing" }
        ]}
      ]
    },

    {
      id: "climber",
      category: "mechanical",
      title: "Climber",
      thesis: "Compact single-stage L1 climber with a brake built into the gearbox.",
      features: [
        { text: "Compact design to allow room for the turret and energy chain"},
        { text: "Braking stage in the gearbox", children: [
          "Past designs used servo or pneumatically actuated brakes",
          "Anti-rollback braking stage removes need for software control, and ensures the climber stays down when the robot is disabled."
        ]},
        { text: "Bottom locking jaw on the climber was added to prevent the robot slipping off the rung." }
      ],
      media: [
        { type: "highlight", views: [
          { tag: "Full Assembly", src: "assets/img/climber-full.webp",
            note: "Single stage, packaged around the shooter and turret energy chain." },
        ]},
        { type: "carousel", label: "Prototyping", items: [
          { tag: "Prototyping", src: "assets/img/climber-2020.png", alt: "2020 climbing mechanism", caption: "2020 single-stage climber was inspiration" }
        ]}
      ]
    }

  ]
};
