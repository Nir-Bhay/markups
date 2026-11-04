"""Read-only source-sitemap/live-HTTP audit and owner indexing worksheet."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import csv, json, re, urllib.request, urllib.error
from datetime import datetime, timezone
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/seo-geo/runs/2026-11-04-search-readiness'
OUT.mkdir(parents=True, exist_ok=True)
urls = [e.text for e in ET.parse(ROOT/'public/sitemap.xml').getroot().iter() if e.tag.endswith('}loc')]
def fetch(url):
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; MarkupsReadOnlyAudit/1.0)'})
        with urllib.request.urlopen(req,timeout=25) as r:
            return r.status,r.geturl(),r.read(1500000).decode('utf-8','replace'),r.headers.get('X-Robots-Tag','')
    except urllib.error.HTTPError as e:return e.code,url,'',''
    except Exception as e:return 'ERROR',url,str(e),''
def row(url):
    route=url.removeprefix('https://markups.dev') or '/'
    rel='index.html' if route=='/' else ('license.html' if route=='/license' else route.strip('/')+'/index.html')
    file=ROOT/'dist'/rel
    source=file.read_text(encoding='utf-8') if file.exists() else ''
    status,final,body,xrobots=fetch(url)
    canonical=re.search(r'<link[^>]+rel=["\x27]canonical["\x27][^>]+href=["\x27]([^"\x27]+)',body,re.I)
    title=re.search(r'<title>(.*?)</title>',source,re.S|re.I)
    return {'url':url,'built_html':file.exists(),'title':title[1] if title else '', 'http_status':status,'final_url':final,'live_canonical':canonical[1] if canonical else '', 'live_x_robots':xrobots,'gsc_index_status':'NOT_INSPECTED','google_selected_canonical':'NOT_INSPECTED','inspection_date':'','request_indexing_date':'','owner_next_action':'Fix/release route before inspection' if status!=200 else 'URL Inspection: indexed report, then live test if needed'}
rows=list(ThreadPoolExecutor(max_workers=6).map(row,urls))
with (OUT/'PAGE-INDEXING-TRACKER.csv').open('w',encoding='utf-8',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=rows[0].keys());writer.writeheader();writer.writerows(rows)
status,_,xml,_=fetch('https://markups.dev/sitemap.xml')
summary={'checked_at_utc':datetime.now(timezone.utc).isoformat(),'source_sitemap_urls':len(urls),'live_sitemap_status':status,'live_sitemap_urls':len(re.findall(r'<loc>',xml)),'status_counts':{str(s):sum(r['http_status']==s for r in rows) for s in set(r['http_status'] for r in rows)},'all_built':all(r['built_html'] for r in rows),'google_index_status':'Unknown; HTTP eligibility does not prove indexing'}
(OUT/'summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2))
