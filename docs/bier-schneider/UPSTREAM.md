# Harly-Updates übernehmen

Dieses Repository ist ein Fork von [Vytral/harly](https://github.com/Vytral/harly) (MIT).
Die Upstream-Historie ist nicht enthalten (sie enthält ein fremdes Secret, das GitHub
Push Protection blockiert). Updates werden deshalb als Patch übernommen.

Letzter übernommener Upstream-Stand: `e4dcae6` (steht auch in `.harly-upstream`).

```bash
git remote add upstream https://github.com/Vytral/harly   # einmalig
git fetch upstream main
BASE=$(cat .harly-upstream)
git checkout -b chore/harly-update
git diff "$BASE" upstream/main | git apply --3way --index
# Konflikte lösen, dann:
git rev-parse --short upstream/main > .harly-upstream
git commit -am "Harly-Update auf $(cat .harly-upstream)"
```

Danach Pull Request öffnen; CI prüft Typen, Tests, Migrationen und das Docker-Image.

Eigene Anpassungen möglichst in eigenen Dateien/Ordnern halten
(`apps/web/src/features/quick-apply/`, `…/funnel/`, `docs/bier-schneider/`),
damit Upstream-Patches selten kollidieren.
