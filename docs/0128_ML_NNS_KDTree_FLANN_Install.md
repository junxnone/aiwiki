---
Title | ML NNS KDTree FLANN Install
-- | --
Created @ | `2021-10-27T08:23:55Z`
Last Modify @| `2022-12-23T15:15:30Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/128)

---

# Flann Install

## Install on Ubuntu

```
sudo apt install libflann-dev
```

## Build from source

```
git clone https://github.com/flann-lib/flann
cd flann
mkdir build
cd build
cmake ..
make
```

- **build issue**

```
CMake Error at src/cpp/CMakeLists.txt:32 (add_library):
  No SOURCES given to target: flann_cpp


CMake Error at src/cpp/CMakeLists.txt:86 (add_library):
  No SOURCES given to target: flann
```

```
touch src/cpp/empty.cpp
```

- `src/cpp/CMakeLists.txt`

```
-    add_library(flann_cpp SHARED "")
+    add_library(flann_cpp SHARED empty.cpp)
-        add_library(flann SHARED "")
+        add_library(flann SHARED empty.cpp)
```
