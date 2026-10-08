import re, urllib.request, pathlib, json
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
ZIEL = pathlib.Path("assets/font"); ZIEL.mkdir(parents=True, exist_ok=True)
URLS = {
 "cormorant": "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap",
 "manrope": "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
}
def hol(u):
    r = urllib.request.Request(u, headers={"User-Agent": UA})
    return urllib.request.urlopen(r, timeout=40).read().decode("utf-8")

blocks = []
for name, u in URLS.items():
    css = hol(u)
    for m in re.finditer(r"/\*\s*([a-z0-9\-\[\]]+)\s*\*/\s*@font-face\s*\{(.*?)\}", css, re.S):
        subset, body = m.group(1), m.group(2)
        if subset not in ("latin", "latin-ext"):
            continue
        fam = re.search(r"font-family:\s*'([^']+)'", body).group(1)
        wght = re.search(r"font-weight:\s*(\d+)", body).group(1)
        style = re.search(r"font-style:\s*(\w+)", body).group(1)
        src = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
        rng = re.search(r"unicode-range:\s*([^;]+);", body).group(1).strip()
        slug = f"{fam.lower().replace(' ','-')}-{wght}{'-italic' if style=='italic' else ''}-{subset}.woff2"
        p = ZIEL / slug
        if not p.exists():
            d = urllib.request.urlopen(urllib.request.Request(src, headers={"User-Agent": UA}), timeout=60).read()
            p.write_bytes(d)
        blocks.append((fam, wght, style, slug, rng, p.stat().st_size))

out = ["/* Schriften lokal — kein Google-Fonts-Abruf beim Besucher (DSGVO). Erzeugt von assets/font/holen.py */"]
for fam, wght, style, slug, rng, _ in sorted(blocks, key=lambda b: (b[0], int(b[1]), b[2])):
    out.append("@font-face{font-family:'%s';font-style:%s;font-weight:%s;font-display:swap;"
               "src:url('font/%s') format('woff2');unicode-range:%s}" % (fam, style, wght, slug, rng))
pathlib.Path("assets/schriften.css").write_text("\n".join(out) + "\n", encoding="utf-8")
print(f"{len(blocks)} Schnitte, {sum(b[5] for b in blocks)/1024:.0f} KB")
for b in sorted(blocks, key=lambda b:(b[0],int(b[1]),b[2])): print(f"  {b[0]} {b[1]} {b[2]:7s} {b[5]/1024:6.1f} KB  {b[3]}")
