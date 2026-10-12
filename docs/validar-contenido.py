#!/usr/bin/env python3
"""Valida data/content.json: referencias cruzadas, ids duplicados y campos obligatorios.
Uso: python docs/validar-contenido.py [ruta/al/content.json]   (por defecto data/content.json)
"""
import json, sys, re
path = sys.argv[1] if len(sys.argv) > 1 else 'data/content.json'
d = json.load(open(path, encoding='utf-8'))
meta = d['meta']; errs = []; warns = []
REQ = ['id', 'modulo', 'titulo', 'nivel', 'resumen', 'secciones', 'pasos', 'seguridad', 'verificarEnManual', 'tips', 'erroresComunes', 'relacionados', 'glosario']
for lang in meta['langs']:
    b = d[lang]; L = b['lecciones']; G = b['glosario']
    lid = [l['id'] for l in L]; gid = [t['id'] for t in G]
    for name, ids in (('lecciones', lid), ('glosario', gid)):
        for i in {x for x in ids if ids.count(x) > 1}: errs.append(f'{lang}: id duplicado en {name}: {i}')
    for l in L:
        for k in REQ:
            if k not in l: errs.append(f'{lang}/{l.get("id")}: falta "{k}"')
        if l.get('modulo') not in meta['modulos']: errs.append(f'{lang}/{l["id"]}: módulo desconocido {l.get("modulo")}')
        if l.get('modulo') == 'diagnostico' and 'diagnostico' not in l: warns.append(f'{lang}/{l["id"]}: módulo diagnostico sin bloque "diagnostico"')
        for r in l.get('relacionados', []):
            if r not in lid: errs.append(f'{lang}/{l["id"]}: relacionado roto {r}')
        for g in l.get('glosario', []):
            if g not in gid: errs.append(f'{lang}/{l["id"]}: término roto {g}')
        if not l.get('fuentes') and not l.get('notaFuentes'): warns.append(f'{lang}/{l["id"]}: sin fuentes')
        if l.get('verificado') and not re.fullmatch(r'\d{4}-\d{2}', l['verificado']): errs.append(f'{lang}/{l["id"]}: "verificado" debe ser AAAA-MM')
        for f in l.get('fuentes', []):
            if not (isinstance(f, str) or f.get('texto')): errs.append(f'{lang}/{l["id"]}: fuente sin texto')
    for t in G:
        for k in ('id', 'termino', 'definicion', 'relacionado'):
            if k not in t: errs.append(f'{lang}/{t.get("id")}: término sin "{k}"')
        for r in t.get('relacionado', []):
            if r not in gid: errs.append(f'{lang}/{t["id"]}: relacionado roto {r}')
    for m in meta['modulos']:
        if m not in b['ui']['modules']: errs.append(f'{lang}: falta ui.modules.{m}')
    print(f'{lang}: {len(L)} lecciones, {len(G)} términos')
for w in warns: print('AVISO', w)
for e in errs: print('ERROR', e)
print('OK' if not errs else f'{len(errs)} errores')
sys.exit(1 if errs else 0)
