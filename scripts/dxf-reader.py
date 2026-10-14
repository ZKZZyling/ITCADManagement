"""DXF evidence reader; no AutoCAD invocation."""
import collections,csv,json
import ezdxf
def position(value):
    return [float(x) for x in value]

def record(entity, scope, warnings):
    kind = entity.dxftype()
    r = {'handle': entity.dxf.get('handle'), 'type': kind, 'scope': scope, 'layer': entity.dxf.get('layer', '0')}
    try:
        if kind in {'TEXT', 'MTEXT', 'ATTRIB', 'ATTDEF'}:
            r['text'] = entity.plain_text() if kind == 'MTEXT' else entity.dxf.get('text', '')
            r['insert'] = position(entity.dxf.insert)
            r['style'] = entity.dxf.get('style', 'Standard')
            if kind in {'ATTRIB', 'ATTDEF'}: r['tag'] = entity.dxf.tag
        elif kind == 'INSERT':
            r.update(block=entity.dxf.name, insert=position(entity.dxf.insert), rotation=entity.dxf.get('rotation', 0),
                     scale=[entity.dxf.get(x, 1) for x in ('xscale', 'yscale', 'zscale')],
                     row_count=entity.dxf.get('row_count', 1), column_count=entity.dxf.get('column_count', 1),
                     attributes=[{'tag': a.dxf.tag, 'text': a.dxf.text, 'handle': a.dxf.handle} for a in entity.attribs])
        elif kind == 'LINE':
            r.update(start=position(entity.dxf.start), end=position(entity.dxf.end), native_length=entity.dxf.start.distance(entity.dxf.end))
        elif kind in {'CIRCLE', 'ARC'}:
            r.update(center=position(entity.dxf.center), radius=float(entity.dxf.radius))
            if kind == 'ARC': r.update(start_angle=float(entity.dxf.start_angle), end_angle=float(entity.dxf.end_angle))
        elif kind == 'LWPOLYLINE':
            r.update(vertices=[list(v) for v in entity.get_points('xyb')], closed=bool(entity.closed), elevation=entity.dxf.get('elevation', 0))
        elif kind == 'DIMENSION':
            r.update(text_override=entity.dxf.get('text', ''), dimstyle=entity.dxf.get('dimstyle'))
            try: r['measurement'] = entity.get_measurement()
            except Exception as ex: r['measurement_error'] = str(ex)
        elif kind == 'IMAGE':
            r['image_file'] = entity.image_def.dxf.filename if entity.image_def else None
        elif kind.endswith('UNDERLAY'):
            definition = entity.underlay_def
            r['underlay_file'] = definition.dxf.filename if definition else None
    except Exception as ex:
        warnings.append({'handle': r['handle'], 'type': kind, 'error': str(ex)})
        r['extraction_error'] = str(ex)
    return r

def extract(dxf, root):
    doc = ezdxf.readfile(dxf)
    warnings = []
    counts = collections.Counter(); by_layer = collections.Counter(); layout_info = []; block_info = []
    texts = 0
    with (root / 'entities.jsonl').open('w', encoding='utf-8') as stream, (root / 'text.csv').open('w', encoding='utf-8-sig', newline='') as tf:
        writer = csv.DictWriter(tf, fieldnames=['scope', 'handle', 'type', 'layer', 'tag', 'text'])
        writer.writeheader()
        def consume(entities, scope, placed):
            nonlocal texts
            number = 0
            for entity in entities:
                r = record(entity, scope, warnings)
                stream.write(json.dumps(r, ensure_ascii=False, default=str) + '\n'); number += 1
                if placed: counts[r['type']] += 1; by_layer[r['layer']] += 1
                rows = [r] if 'text' in r else []
                rows.extend(dict(scope=scope, handle=a['handle'], type='ATTRIB', layer=r['layer'], tag=a['tag'], text=a['text']) for a in r.get('attributes', []))
                for row in rows:
                    writer.writerow({k: row.get(k, '') for k in writer.fieldnames}); texts += 1
            return number
        for layout in doc.layouts:
            scope = 'layout:' + layout.name
            count = consume(layout, scope, True)
            obj = layout.dxf_layout
            layout_info.append({'name': layout.name, 'entity_count': count, 'plot_configuration': obj.dxf.get('plot_configuration_file'),
                                'paper': obj.dxf.get('paper_size'), 'plot_style': obj.dxf.get('current_style_sheet'),
                                'paper_units': obj.dxf.get('plot_paper_units'), 'plot_type': obj.dxf.get('plot_type')})
        for block in doc.blocks:
            if block.name.startswith('*Model_Space') or block.name.startswith('*Paper_Space'): continue
            definition = block.block
            flags = definition.dxf.get('flags', 0)
            count = consume(block, 'block-definition:' + block.name, False)
            block_info.append({'name': block.name, 'entity_count': count, 'flags': flags, 'xref': bool(flags & 12),
                               'xref_path': definition.dxf.get('xref_path', ''), 'base_point': position(definition.dxf.base_point)})
    layers = [{'name': l.dxf.name, 'color': l.dxf.color, 'linetype': l.dxf.linetype, 'off': l.is_off(),
               'frozen': l.is_frozen(), 'locked': l.is_locked(), 'plot': l.dxf.get('plot', 1)} for l in doc.layers]
    styles = [{'name': s.dxf.name, 'font': s.dxf.get('font'), 'bigfont': s.dxf.get('bigfont')} for s in doc.styles]
    return {'dxf_version': doc.dxfversion, 'insunits': doc.header.get('$INSUNITS', 0), 'measurement': doc.header.get('$MEASUREMENT'),
            'extmin': position(doc.header.get('$EXTMIN', (0,0,0))), 'extmax': position(doc.header.get('$EXTMAX', (0,0,0))),
            'layout_entity_counts': dict(counts), 'layout_layer_counts': dict(by_layer), 'layers': layers, 'layouts': layout_info,
            'block_definitions': block_info, 'text_styles': styles, 'text_record_count': texts, 'extraction_warnings': warnings,
            'limits': ['Block definitions are not placed device counts.', 'Nested inserts and dynamic effective block names are not expanded.',
                       'Native lengths are drawing geometry, not installed cable takeoffs.', 'External references and proxy/custom entities require separate review.',
                       'Staging copies may change relative dependency resolution.', 'Header extents may be stale; verify visual bounds.']}
