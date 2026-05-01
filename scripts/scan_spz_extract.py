#!/usr/bin/env python3
import gzip, struct, sys, os

SPZ_PATH='public/models/test.spz'
OUT_PLY='public/models/extracted_from_test.ply'
if len(sys.argv)>1:
    SPZ_PATH=sys.argv[1]
if len(sys.argv)>2:
    OUT_PLY=sys.argv[2]

print('Reading', SPZ_PATH)
with gzip.open(SPZ_PATH,'rb') as f:
    data=f.read()
print('Decompressed bytes:', len(data))

block_triples = 2000
block_bytes = block_triples*12
step = 4096
length=len(data)

def is_valid_float(b):
    # interpret 4 bytes as little-endian float
    try:
        v=struct.unpack('<f', b)[0]
    except Exception:
        return False
    if not (v==v): return False
    if abs(v)>1e5: return False
    return True

found_offset=None
for offset in range(0, length-block_bytes, step):
    # sample 10 positions within block
    ok=0
    for s in range(10):
        i = offset + (s*(block_bytes//10))
        # read 3 floats
        try:
            a=struct.unpack_from('<fff', data, i)
        except struct.error:
            break
        if all(abs(x)<1e4 and x==x for x in a):
            ok+=1
    if ok>=8:
        # deeper check
        cnt = 0
        max_cnt = 0
        max_start = None
        pos = offset
        limit = offset + block_bytes
        while pos + 12 <= limit:
            try:
                x, y, z = struct.unpack_from('<fff', data, pos)
            except struct.error:
                break
            if all(abs(v) < 1e4 and v == v for v in (x, y, z)):
                if cnt == 0:
                    start_pos = pos
                cnt += 1
                pos += 12
            else:
                if cnt > max_cnt:
                    max_cnt = cnt
                    max_start = start_pos
                cnt = 0
                pos += 12
        if cnt > max_cnt:
            max_cnt = cnt
            max_start = start_pos
        print('offset', offset, 'sample_ok', ok, 'max_run', max_cnt, 'start', max_start)
        if max_cnt >= 500 and max_start is not None:
            found_offset = max_start
            break

if found_offset is None:
    print('No candidate block found')
    sys.exit(2)

# extract consecutive triples starting at found_offset
triples=[]
pos=found_offset
while pos+12<=length:
    x,y,z = struct.unpack_from('<fff', data, pos)
    if all(abs(v)<1e4 and v==v for v in (x,y,z)):
        triples.append((x,y,z))
        pos+=12
    else:
        break

print('Found', len(triples), 'triples at', found_offset)
if len(triples)<10:
    print('Too few triples, abort')
    sys.exit(3)

# write ASCII PLY
with open(OUT_PLY,'w') as out:
    out.write('ply\n')
    out.write('format ascii 1.0\n')
    out.write(f'element vertex {len(triples)}\n')
    out.write('property float x\n')
    out.write('property float y\n')
    out.write('property float z\n')
    out.write('end_header\n')
    for x,y,z in triples:
        out.write(f"{x} {y} {z}\n")

print('Wrote', OUT_PLY)
os.chmod(OUT_PLY, 0o644)
