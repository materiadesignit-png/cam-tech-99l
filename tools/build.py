# Assembla src/ in un solo HTML (dist/cam-tech99l.html) e nella app desktop (desktop/app/index.html)
import os
B = os.path.dirname(os.path.abspath(__file__)) + '/../'
S = B + 'src/'
app = ''.join(open(S + 'app2' + x + '.js', encoding='utf8').read() for x in 'abcefghijklmd')
h = open(S + 'ui2.html', encoding='utf8').read()
for ph, f in [('/*CLIPPER*/', B + 'vendor/clipper.js'), ('/*CORE*/', S + 'core.js'), ('/*GEOM*/', S + 'geom.js'), ('/*TOPO*/', S + 'topo.js'), ('/*OPENTYPE*/', B + 'vendor/opentype.min.js'), ('/*FONTS*/', S + 'fonts.js'), ('/*SHAPES*/', S + 'shapes.js'), ('/*SKETCH*/', S + 'sketch.js')]:
    assert ph in h, ph; h = h.replace(ph, open(f, encoding='utf8').read().replace('</script', '<\\/script'), 1)
h = h.replace('/*APP*/', app.replace('</script', '<\\/script'), 1)
os.makedirs(B + 'dist', exist_ok=True)
open(B + 'dist/cam-tech99l.html', 'w', encoding='utf8').write(h)
w = '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + h + '</body></html>'
open(B + 'desktop/app/index.html', 'w', encoding='utf8').write(w)
print('ok', len(h))
