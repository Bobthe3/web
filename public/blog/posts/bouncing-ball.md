---
title: "Bouncing Ball"
date: "2026-01-12"
tags: ["rive", "animation"]
---

# Bouncing Ball

A simple bouncing ball animation created with Rive. An experiment with Rive animation tools and state machines.

<div class="rive-container">
    <canvas id="rive-canvas" width="400" height="400"></canvas>
</div>

<script src="https://unpkg.com/@rive-app/canvas@2.21.6"></script>
<script>
    const canvas = document.getElementById('rive-canvas');
    const r = new rive.Rive({
        src: '/blog/rive/bouncingBall.riv',
        canvas: canvas,
        autoplay: true,
        fit: rive.Fit.Contain,
        alignment: rive.Alignment.Center,
        onLoad: () => {
            r.resizeDrawingSurfaceToCanvas();
        }
    });
    window.addEventListener('resize', () => {
        r.resizeDrawingSurfaceToCanvas();
    });
</script>
