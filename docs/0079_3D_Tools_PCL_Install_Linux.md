---
Title | 3D Tools PCL Install Linux
-- | --
Created @ | `2021-06-18T07:48:19Z`
Last Modify @| `2022-12-25T03:56:46Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/79)

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

