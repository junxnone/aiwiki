---
Title | PCL Building with Linux
-- | --
Create Date | `2021-10-13T01:20:48Z`
Update Date | `2021-10-13T01:20:48Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/79)

---
# Reference
- []()

# Brief

# Build Steps
```
mkdir build
cd build
cmake ..
make -j n
```

# Build with Intel Compiler
```
set(CMAKE_C_COMPILER "icx")
set(CMAKE_CXX_COMPILER "icpx")
```

