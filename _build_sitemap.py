BASE="https://whitesim-lab.com"
LASTMOD="2026-07-24"
paths=["/",
 "/tools/bear-hunt/","/tools/king-castle/","/tools/foundry-battle/","/tools/frost-dragon/",
 "/tools/left-hero/","/tools/troop-ratio/","/tools/damage-doctor/","/tools/commander-type/","/tools/hero-list/",
 "/guides/bear-hunt-guide.html","/guides/beginner-faq.html","/guides/troop-ratio.html","/guides/left-hero.html",
 "/guides/leader-formation.html","/guides/damage-not-growing.html","/guides/common-myths.html","/guides/cyril-talent.html",
 "/guides/f2p-damage.html","/guides/light-spender.html","/guides/how-to-use.html",
 "/about.html","/recruit.html","/changelog.html","/privacy.html","/terms.html","/contact.html"]
def en(p): return "/en/" if p=="/" else "/en"+p
def alts(p):
    ja=BASE+p; e=BASE+en(p)
    return (f'    <xhtml:link rel="alternate" hreflang="ja" href="{ja}"/>\n'
            f'    <xhtml:link rel="alternate" hreflang="en" href="{e}"/>\n'
            f'    <xhtml:link rel="alternate" hreflang="x-default" href="{ja}"/>\n')
out=['<?xml version="1.0" encoding="UTF-8"?>',
 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
for p in paths:
    for loc in (BASE+p, BASE+en(p)):
        out.append(f'  <url><loc>{loc}</loc><lastmod>{LASTMOD}</lastmod>\n{alts(p)}  </url>')
out.append('</urlset>')
open("sitemap.xml","w",encoding="utf-8").write("\n".join(out)+"\n")
print("sitemap urls:", len(paths)*2)
