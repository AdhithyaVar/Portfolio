# Udhaya Adhithya Varman — Cinematic 3D AI Engineer Portfolio

A production-grade, responsive, interactive 3D WebGL portfolio website showcasing end-to-end GenAI systems, hybrid RAG pipelines, multi-agent frameworks, and real-time edge computer vision architectures.

---

## Folder Architecture

The project is structured according to production web standards with clean separation of source code, modular section partials, assets, and distribution builds:

```
portfolio/
├── index.html                           # Self-contained, zero-dependency production bundle (deploy-ready)
├── modular.html                         # Modular development entry point (loads separate CSS & JS)
├── favicon.svg                          # High-resolution vector icon with futuristic neural/UAV motif
├── favicon.ico                          # Multi-resolution ICO icon for browser compatibility
├── .nojekyll                            # Instructs GitHub Pages to serve static files directly without Jekyll
├── LICENSE                              # Official MIT open-source software license
├── LICENSES.txt                         # Third-party license attributions (Three.js, fflate, fonts)
├── robots.txt                           # Web crawler instructions & sitemap locator
├── sitemap.xml                          # Canonical XML search engine sitemap
├── _headers                             # Security response headers (Content-Type, Referrer, Permissions)
├── package.json                         # npm script definitions for development and builds
├── README.md                            # Comprehensive project guide and deployment handbook
├── .gitignore                           # Git ignore rules for clean repository management
├── Udhaya_Adhithya_Varman_Resume.pdf    # Official AI Engineer resume PDF
├── Adhithya.pdf                         # Resume PDF (root alias matching source submission)
│
├── .github/
│   └── workflows/
│       └── deploy.yml                   # Automated GitHub Actions workflow for zero-config Pages deployment
│
├── index/                               # Modular HTML partials & section components
│   ├── header.html                      # Navigation bar with responsive glassmorphism pill design
│   ├── hero.html                        # Section 00: Robot Model + Headline + CTA Buttons
│   ├── about.html                       # Section 01 & 02: Bio, Background, and Experience Card (Brain)
│   ├── work.html                        # Section 03: Selected Work & Project Cards (Neural Network)
│   ├── skills.html                      # Section 04: Technical Expertise & Tooling Matrices
│   ├── education.html                   # Section 05: Academic Degree & Certifications (Monitor)
│   ├── contact.html                     # Section 06: Contact info & direct email action (Keyboard)
│   └── footer.html                      # Semantic footer & copyright mark
│
├── src/                                 # Developer source directory
│   ├── css/
│   │   └── style.css                    # Master stylesheet with full design tokens & media queries
│   ├── js/
│   │   ├── geometry-data.js             # Compressed 3D particle coordinate arrays (~26k points)
│   │   └── app.js                       # Three.js scene, shaders, camera framing, and render loop
│   └── build/
│       └── build.py                     # Python compiler that bundles src/ + index/ into index.html
│
├── assets/                              # Production static assets & compiled distributions
│   ├── css/
│   │   └── style.css                    # Production stylesheet
│   ├── js/
│   │   ├── app.js                       # Application script
│   │   └── geometry-data.js             # Geometry data
│   ├── docs/
│   │   ├── Udhaya_Adhithya_Varman_Resume.pdf # Official AI Engineer resume PDF
│   │   └── Adhithya.pdf                 # Alternate resume filename
│   ├── models/
│   │   └── README.md                    # Technical documentation for the 5 3D models
│   ├── favicon.svg                      # Asset favicon SVG
│   └── favicon.ico                      # Asset favicon ICO
│
└── assest/                              # Convenience mirror of assets/ (handles common naming patterns)
    ├── css/
    ├── js/
    └── docs/
```

---

## Getting Started

### Prerequisites
- Python 3.8+ (or Node.js 18+ / any local HTTP server)
- Modern web browser with WebGL 2.0 support (Chrome, Safari, Firefox, Edge)

### Local Development

1. Open your terminal in the `portfolio` folder:
   ```bash
   cd portfolio
   ```

2. Start the local development server:
   ```bash
   # Using Python:
   python -m http.server 8080

   # Or using Node / npm:
   npm run dev
   ```

3. Open your browser:
   - Standalone Production Build: [http://localhost:8080/index.html](http://localhost:8080/index.html)
   - Modular Development Build: [http://localhost:8080/modular.html](http://localhost:8080/modular.html)

---

## Build System

To recompile `portfolio/index.html` after editing files in `index/`, `src/css/`, or `src/js/`:

```bash
python src/build/build.py
# Or:
npm run build
```

This merges the HTML partials, inlines the stylesheet and scripts into an ultra-fast, self-contained single-file bundle with zero runtime build dependencies.

---

## 3D WebGL Features & Visual Identity

- **5 Morphing 3D Particle Models**:
  - **Hero**: AI Assistant Robot with subtle pointer-following dynamics.
  - **About / Experience**: Synaptically active human cerebral cortex.
  - **Projects / Skills**: Dynamic deep neural network with edge-propagating signal pulses.
  - **Education**: Stationary desktop monitor locked forward at reference brightness `1.08`.
  - **Contact**: Hardware keyboard with 360° local rotation at reference brightness `0.40`.
- **Zero-Jerk Exponential Motion Filter**:
  - All model positions ($X, Y$) and scales are updated with continuous $C^\infty$ exponential damping ($\approx 100\text{ms}$ smooth relaxation).
  - Absolutely zero discrete jumping or scale popping during aggressive scrolling.
- **Responsive Layout Structural Clearance**:
  - **Desktop ($\ge 1024\text{px}$)**: Two-column grid with text strictly bounded to $\le 42\text{vw}$ on the left and model safely anchored on the right. Guaranteed $> 200\text{px}$ clearance.
  - **Mobile ($< 1024\text{px}$)**: Dedicated top viewport slot (`order: -1; height: clamp(230px, 36svh, 320px)`) placing the model above the text with zero collision.
- **Glassmorphism & Typography**:
  - Editorial headings in *Cormorant Garamond* paired with high-legibility sans-serif *Jost*.
  - Backdrop-filtered blur pills, subtle borders, and accessible focus states.

---

## Deployment Guide

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` inside `portfolio/`
3. Set output directory to `./` (root contains `index.html`).

### Netlify
1. Drag and drop the `portfolio/` folder onto [Netlify Drop](https://app.netlify.com/drop).
2. Or connect via Git and set Publish directory to `portfolio`.

### GitHub Pages
1. Push the contents of `portfolio/` to the `gh-pages` branch (or `main` branch under `/docs` or root).
2. Enable GitHub Pages in Repository Settings -> Pages -> Source: Deploy from branch.

---

## Author

**Udhaya Adhithya Varman**
- **Role**: AI Engineer / CSE (AI) Graduate
- **Email**: [udhayaadhithyavarman@gmail.com](mailto:udhayaadhithyavarman@gmail.com)
- **Phone**: +91 9483215500
- **Resume**: [assets/docs/Udhaya_Adhithya_Varman_Resume.pdf](assets/docs/Udhaya_Adhithya_Varman_Resume.pdf)
