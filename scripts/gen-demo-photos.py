#!/usr/bin/env python3
"""Gera as "fotos" SVG estilizadas dos carros de demonstração.

Uso: python3 scripts/gen-demo-photos.py
Saída: public/demo/cars/*.svg (4:3, ~2KB cada)

Cenas vetoriais deliberadamente estilizadas (silhueta + gradientes) —
não fingem ser fotografia; dão vida aos templates de demonstração sem
depender de banco de imagens ou licenças.
"""

import os
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "demo" / "cars"

W, H = 800, 600
GROUND_Y = 438

# silhuetas (side view, rodas em y=438; carro ocupa x∈[95,706])
SEDAN_BODY = (
    "M 95 380 C 100 340 130 320 190 312 C 240 306 272 300 302 272 "
    "C 332 244 382 230 448 230 C 520 230 560 248 590 278 "
    "C 610 298 640 308 670 314 C 700 320 706 336 706 356 L 706 380 "
    "C 706 392 698 398 686 398 L 646 398 A 52 52 0 0 0 542 398 "
    "L 268 398 A 52 52 0 0 0 164 398 L 115 398 C 102 398 95 392 95 380 Z"
)
SEDAN_GLASS = (
    "M 314 276 C 340 250 386 240 448 240 C 510 240 546 254 570 278 "
    "C 574 282 572 286 566 286 L 322 286 C 312 286 308 282 314 276 Z"
)
SUV_BODY = (
    "M 95 380 C 98 336 118 318 168 310 C 210 304 236 296 258 262 "
    "C 278 232 320 218 420 218 C 520 218 570 232 600 262 "
    "C 622 284 650 300 676 308 C 700 316 706 332 706 354 L 706 380 "
    "C 706 392 698 398 686 398 L 646 398 A 52 52 0 0 0 542 398 "
    "L 268 398 A 52 52 0 0 0 164 398 L 115 398 C 102 398 95 392 95 380 Z"
)
SUV_GLASS = (
    "M 276 266 C 292 240 330 228 420 228 C 510 228 552 240 578 264 "
    "C 584 270 582 274 574 274 L 286 274 C 276 274 270 274 276 266 Z"
)
PICKUP_BODY = (
    "M 95 380 C 98 342 116 324 164 316 C 206 310 232 300 254 266 "
    "C 272 238 306 226 392 226 C 452 226 480 238 500 264 "
    "C 512 280 520 288 544 292 L 690 292 C 702 292 706 300 706 316 L 706 380 "
    "C 706 392 698 398 686 398 L 646 398 A 52 52 0 0 0 542 398 "
    "L 268 398 A 52 52 0 0 0 164 398 L 115 398 C 102 398 95 392 95 380 Z"
)
PICKUP_GLASS = (
    "M 272 270 C 288 244 320 234 390 234 C 444 234 466 244 484 268 "
    "C 490 276 488 280 480 280 L 282 280 C 272 280 266 280 272 270 Z"
)

SHAPES = {
    "sedan": (SEDAN_BODY, SEDAN_GLASS),
    "suv": (SUV_BODY, SUV_GLASS),
    "pickup": (PICKUP_BODY, PICKUP_GLASS),
}


def scene(shape: str, body_a: str, body_b: str, bg_a: str, bg_b: str,
          view: str = f"0 0 {W} {H}") -> str:
    body, glass = SHAPES[shape]
    # seam entre cabine e caçamba — sem ela a picape lê como perua
    extra = (
        '<path d="M 536 294 L 542 294 L 542 392 L 536 392 Z" fill="#000000" opacity="0.3"/>'
        if shape == "pickup"
        else ""
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{bg_a}"/>
      <stop offset="1" stop-color="{bg_b}"/>
    </linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{body_a}"/>
      <stop offset="1" stop-color="{body_b}"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#dbeafe" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#334155" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect width="{W}" height="{H}" fill="url(#bg)"/>
  <path d="M 0 260 L {W} 150 L {W} 0 L 0 0 Z" fill="#ffffff" opacity="0.04"/>
  <rect y="{GROUND_Y}" width="{W}" height="{H - GROUND_Y}" fill="#000000" opacity="0.18"/>
  <ellipse cx="400" cy="{GROUND_Y + 10}" rx="330" ry="26" fill="#000000" opacity="0.28"/>
  <path d="{body}" fill="url(#body)"/>
  <path d="{glass}" fill="url(#glass)"/>
  {extra}
  <path d="{body}" fill="#ffffff" opacity="0.06" transform="translate(0 -3)"/>
  <g>
    <circle cx="216" cy="438" r="52" fill="#0b1120"/>
    <circle cx="216" cy="438" r="24" fill="#475569"/>
    <circle cx="216" cy="438" r="9" fill="#94a3b8"/>
    <circle cx="594" cy="438" r="52" fill="#0b1120"/>
    <circle cx="594" cy="438" r="24" fill="#475569"/>
    <circle cx="594" cy="438" r="9" fill="#94a3b8"/>
  </g>
  <rect x="96" y="352" width="34" height="12" rx="6" fill="#fde68a" opacity="0.9"/>
  <rect x="676" y="336" width="28" height="10" rx="5" fill="#fca5a5" opacity="0.9"/>
</svg>
"""


# (arquivo-base, silhueta, cor A, cor B, fundo A, fundo B)
CARS = [
    ("civic",    "sedan",  "#e2e8f0", "#94a3b8", "#1e293b", "#0f172a"),
    ("corolla",  "sedan",  "#cbd5e1", "#64748b", "#312e81", "#111827"),
    ("hrv",      "suv",    "#dc2626", "#7f1d1d", "#e2e8f0", "#94a3b8"),
    ("compass",  "suv",    "#0f172a", "#020617", "#d6d3d1", "#78716c"),
    ("tcross",   "suv",    "#2563eb", "#1e3a8a", "#e0f2fe", "#7dd3fc"),
    ("onix",     "sedan",  "#f8fafc", "#cbd5e1", "#164e63", "#082f49"),
    ("hilux",    "pickup", "#57534e", "#292524", "#fef3c7", "#d97706"),
    ("ranger",   "pickup", "#1d4ed8", "#172554", "#e7e5e4", "#a8a29e"),
    ("golf",     "sedan",  "#fbbf24", "#b45309", "#1c1917", "#0c0a09"),
]

# shots extras: recorte aproximado (zoom na dianteira) com o mesmo cenário
ZOOM_VIEW = "60 140 560 420"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    count = 0
    for name, shape, ba, bb, ga, gb in CARS:
        (OUT / f"{name}-1.svg").write_text(scene(shape, ba, bb, ga, gb))
        (OUT / f"{name}-2.svg").write_text(scene(shape, ba, bb, gb, ga, ZOOM_VIEW))
        count += 2
    print(f"{count} SVGs gerados em {OUT}")


if __name__ == "__main__":
    main()
