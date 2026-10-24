#!/usr/bin/env python3
"""Prepare and build the supplied React template without fetching any dependency."""
import argparse, hashlib, json, os, pathlib, shutil, subprocess, tarfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
def extract_safe(archive,destination):
    with tarfile.open(archive,'r:gz') as tar:
        for member in tar.getmembers():
            dest=(destination/member.name).resolve()
            if not dest.is_relative_to(destination.resolve()) or member.issym() or member.islnk():
                raise ValueError(f'Unsafe archive member: {member.name}')
        tar.extractall(destination, **({'filter':'data'} if hasattr(tarfile,'data_filter') else {}))
def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--target',type=pathlib.Path,help='Create a new app directory; refuses nonempty destinations')
    p.add_argument('--cache-dir',type=pathlib.Path,help='Optional writable npm cache directory')
    p.add_argument('--serve',action='store_true');args=p.parse_args()
    template=ROOT/'assets/template'
    if args.target:
        dest=args.target.resolve()
        if dest.exists() and any(dest.iterdir()):raise SystemExit('Target must be empty; existing applications are never overwritten.')
        shutil.copytree(template,dest,dirs_exist_ok=True,ignore=shutil.ignore_patterns('node_modules','dist','.test-build','.offline-npm-cache','licenses'))
    else:dest=template
    shutil.copytree(ROOT/'assets/licenses',dest/'licenses',dirs_exist_ok=True)
    manifest=json.loads((ROOT/'assets/vendor/manifest.json').read_text())
    archive=ROOT/'assets/vendor/npm-cache.tar.gz'
    if hashlib.sha256(archive.read_bytes()).hexdigest()!=manifest['sha256']:raise SystemExit('Offline dependency archive failed integrity verification.')
    cache=args.cache_dir.resolve() if args.cache_dir else dest/'.offline-npm-cache'
    if not cache.exists():extract_safe(archive,cache)
    npm=shutil.which('npm.cmd' if os.name=='nt' else 'npm')
    if not npm:raise SystemExit('Install Node.js 18+ and npm before entering the offline environment. No runtime installer is bundled.')
    for command in [[npm,'ci','--offline','--ignore-scripts','--no-audit','--no-fund','--cache',str(cache)],[npm,'run','typecheck'],[npm,'run','build'],[npm,'test']]:
        subprocess.run(command,cwd=dest,check=True)
    print(f'Offline build complete: {dest / "dist"}')
    if args.serve:subprocess.run([npm,'run','serve'],cwd=dest,check=True)
if __name__=='__main__':main()
