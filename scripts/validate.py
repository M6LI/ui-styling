#!/usr/bin/env python3
"""Validate skill structure, references, source checksums and offline artifacts."""
import hashlib,json,pathlib,re,sys
root=pathlib.Path(__file__).resolve().parents[1];errors=[]
skill=(root/'SKILL.md').read_text()
if not skill.startswith('---\nname: ui-styling\n'):errors.append('Invalid skill frontmatter')
for target in re.findall(r'\]\(([^)#]+)(?:#[^)]*)?\)',skill):
 if '://' not in target and not (root/target).exists():errors.append('Missing skill reference: '+target)
for name in ['assets/template/src/main.tsx','assets/template/src/ui.tsx','assets/template/src/domain.ts','assets/template/package-lock.json','assets/design-tokens.json','assets/vendor/npm-cache.tar.gz','assets/reference/metrics.png','assets/reference/rfqs.png']:
 if not (root/name).exists():errors.append('Missing: '+name)
manifest=json.loads((root/'references/upstream-manifest.json').read_text())
for item in manifest['files']:
 file=root/'references/upstream'/item['path'].removeprefix('aim/web/ui/')
 if hashlib.sha256(file.read_bytes()).hexdigest()!=item['sha256']:errors.append('Modified upstream evidence: '+str(file))
archive=root/'assets/upstream/aim-3.29.1-frontend.tar.gz'
if hashlib.sha256(archive.read_bytes()).hexdigest()!=manifest['archive_sha256']:errors.append('Upstream archive checksum mismatch')
for item in json.loads((root/'references/font-asset-manifest.json').read_text()):
 if hashlib.sha256((root/item['path']).read_bytes()).hexdigest()!=item['sha256']:errors.append('Modified font/glyph asset: '+item['path'])
vendor=json.loads((root/'assets/vendor/manifest.json').read_text())
if hashlib.sha256((root/'assets/vendor/npm-cache.tar.gz').read_bytes()).hexdigest()!=vendor['sha256']:errors.append('Dependency archive checksum mismatch')
for file in (root/'assets/template/src').glob('*'):
 if file.suffix in ['.tsx','.css','.ts'] and re.search(r'(?:https?:)?//(?:cdn|fonts\.)',file.read_text()):errors.append('Remote UI dependency: '+str(file))
print('\n'.join(errors) if errors else 'Skill structure, references, source hashes and local asset checks passed.')
sys.exit(bool(errors))
