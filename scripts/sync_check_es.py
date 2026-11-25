import json, glob, os
base="packages/i18n/src/locales"
def keys(d,p=''):
    out=set()
    if isinstance(d,dict):
        for k,v in d.items(): out|=keys(v,p+'.'+k if p else k)
    return out
bad=0
for f in sorted(glob.glob(os.path.join(base,'en','*.json'))):
    n=os.path.basename(f)
    es=os.path.join(base,'es',n)
    if not os.path.exists(es):
        print('FALTA ES:',n); bad+=1; continue
    a=keys(json.load(open(f))); b=keys(json.load(open(es)))
    if a-b or b-a:
        print(n,'faltan_en_es:',len(a-b),'sobran_en_es:',len(b-a)); bad+=1
print('ficheros con desajuste:',bad)
