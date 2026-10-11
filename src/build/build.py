#!/usr/bin/env python3
"""
Production Portfolio Build Pipeline
Compiles modular source files (index/*.html, src/css/style.css, src/js/*.js)
into a self-contained, zero-dependency production bundle: portfolio/index.html
"""

import os
import re

PORTFOLIO_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INDEX_DIR = os.path.join(PORTFOLIO_DIR, "index")
SRC_DIR = os.path.join(PORTFOLIO_DIR, "src")
ASSETS_DIR = os.path.join(PORTFOLIO_DIR, "assets")

def build():
    print("Building production portfolio bundle...")

    # 1. Read CSS
    with open(os.path.join(SRC_DIR, "css", "style.css"), "r", encoding="utf-8") as f:
        css = f.read().strip()

    # 2. Read HTML Partials
    def read_partial(name):
        path = os.path.join(INDEX_DIR, name)
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()

    header = read_partial("header.html")
    hero = read_partial("hero.html")
    about = read_partial("about.html")
    work = read_partial("work.html")
    skills = read_partial("skills.html")
    education = read_partial("education.html")
    contact = read_partial("contact.html")
    footer = read_partial("footer.html")

    # 3. Read Scripts
    with open(os.path.join(SRC_DIR, "js", "geometry-data.js"), "r", encoding="utf-8") as f:
        geom_js = f.read().strip()

    with open(os.path.join(SRC_DIR, "js", "app.js"), "r", encoding="utf-8") as f:
        app_js = f.read().strip()

    # 4. Assemble Bundle
    bundle = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#000000">
<meta name="description" content="Portfolio of Udhaya Adhithya Varman — AI Engineer specializing in end-to-end GenAI systems, hybrid RAG, multi-agent pipelines, and real-time edge computer vision.">
<title>Udhaya Adhithya Varman | AI Engineer</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
<canvas id="bg" aria-hidden="true"></canvas>

{header}

<main>
{hero}
{about}
{work}
{skills}
{education}
{contact}
</main>

{footer}

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
{geom_js}
</script>
<script>
{app_js}
</script>
</body>
</html>
"""

    out_path = os.path.join(PORTFOLIO_DIR, "index.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(bundle)

    print(f"Build complete: {out_path} ({len(bundle)} bytes)")

if __name__ == "__main__":
    build()
