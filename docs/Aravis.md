---
Title | Aravis
-- | --
Create Date | `2021-10-19T16:32:03Z`
Update Date | `2021-10-19T16:50:08Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/108)

---
# Brief
- Genicam cameras Tools


## Build
### Build with Ubuntu

```
sudo apt install libxml2-dev libgtk-3-dev libgirepository1.0-dev meson
git clone https://github.com/AravisProject/aravis
meson configure -Dviewer=enabled
cd build
ninja
sudo ninja install
```

## UseCase
- arv-viewer-xxx

