from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
target=root/'public/source.zip'
allowed=['.github','public','server','scripts','tests','content','previews','skills','docs','README.md','LICENSE','package.json','.gitignore','.gitattributes']
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
 for entry in allowed:
  path=root/entry
  for f in ([path] if path.is_file() else sorted(path.rglob('*'))):
   if f.is_file() and f!=target and '__pycache__' not in f.parts and not f.name.endswith('.pyc'):
    archive.write(f,'intentkit/'+f.relative_to(root).as_posix())
print(f'Portable source package (MIT application + OFL fonts): {target.stat().st_size} bytes.')
