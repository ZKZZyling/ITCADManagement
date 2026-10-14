"""Bounded native DXF primitives omitted by the legacy review pipeline."""
import math,itertools
from ezdxf.path import from_hatch

def supplemental_geometry(entity,limit=50000):
    typ=entity.dxftype()
    if typ=='POINT':
        p=entity.dxf.location
        xy=[round(p.x,3),round(p.y,3)]
        if not all(math.isfinite(v) and abs(v)<=2e8 for v in xy):raise ValueError('Invalid point')
        return {'kind':'path','points':[xy,xy.copy()],'pointMarker':True,'type':typ}
    if typ!='HATCH':return None
    rings=[];count=0
    for boundary in from_hatch(entity):
        points=[[round(p.x,3),round(p.y,3)] for p in itertools.islice(boundary.flattening(15),limit+1)]
        count+=len(points)
        if count>limit:raise ValueError('Hatch boundary point limit')
        if any(not math.isfinite(v) or abs(v)>2e8 for p in points for v in p):raise ValueError('Invalid hatch')
        if len(points)>=3:
            if points[0]!=points[-1]:points.append(points[0].copy())
            rings.append(points)
    if not rings:raise ValueError('Empty hatch boundary')
    return {'kind':'path','points':[p for ring in rings for p in ring],'fillRings':rings,'solidFill':bool(entity.dxf.solid_fill),'hatchPattern':entity.dxf.pattern_name,'type':typ,'patternFidelity':'solid-boundaries' if entity.dxf.solid_fill else 'boundary-only-pattern-unverified'}
