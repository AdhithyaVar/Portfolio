# 3D Particle Models Architecture

This portfolio features 5 interactive 3D particle models constructed with GPU instancing, vertex shader morphing, and precision procedural animation:

1. **Section 00 (Hero / Top)**: **Interactive AI Assistant Robot**
   - 26,000+ coordinates packed in 16-bit compressed integer arrays.
   - Smooth mouse/pointer tilt reaction.
   - Rest position: Right column on desktop, upper-center slot on mobile.

2. **Section 01 & 02 (About & Experience)**: **Human Neural Cortex / Brain**
   - Procedural synchronized rotation around the Y-axis.
   - Subtle pulse waves representing synaptic firing.

3. **Section 03 & 04 (Selected Work & Skills)**: **Dynamic Deep Neural Network Graph**
   - Interconnected neural nodes with real-time propagating signals across synapses.
   - Directional signal pulses traversing graph edges.

4. **Section 05 (Education & Certifications)**: **Developer Workspace Desktop Monitor**
   - Displays academic degree and certification badges.
   - **Stationary Camera Lock**: Remains facing forward with strict rotation locking. Reference brightness: `1.08`.

5. **Section 06 (Contact)**: **Keyboard Hardware Mesh**
   - 360° local horizontal continuous spin in place.
   - Reference brightness: `0.40`.

## Geometry Encoding
Model coordinates are stored in gzip-compressed base64 arrays in `assets/js/geometry-data.js` and decompressed in browser WebGL memory via custom Three.js `BufferGeometry` attributes.
