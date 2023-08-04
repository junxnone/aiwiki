-----

| Title     | OpenCV IPP                                            |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-08-01T14:08:47Z`                                |
| Updated @ | `2023-08-04T10:15:16Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/430) |

-----

# OpenCV With IPP

  - [Intel Integrated Performance
    Primitives](https://junxnone.github.io/xwiki/#/0032_OPT_LIB_IPP?id=ipp-intel-integrated-performance-primitives)
  - OpenCV 中部分函数使用了 `IPP` 的实现, 不属于 `OpenSource`
  - 官方 Release 版本包含 IPP, 直接编译到了 `opencv library` 中
  - 手动编译时可以通过 `WITH_IPP` 指定是否编译 `IPP`
  - Ubuntu Package `libopencv-dev` 默认是
    [DWITH\_IPP=OFF](https://salsa.debian.org/science-team/opencv/-/blob/debian/experimental/debian/rules#L105)

-----

<script src="https://emgithub.com/embed-v2.js?target=https%3A%2F%2Fgithub.com%2Fopencv%2Fopencv%2Fblob%2F0052d46b8e33c7bfe0e1450e4bff28b88f455570%2FCMakeLists.txt%23L290-L292&style=default&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></script>

-----

## OS Environment `OPENCV_IPP`

  - Options
      - avx512
      - avx2
      - sse42
      - disabled

-----

<script src="https://emgithub.com/embed-v2.js?target=https%3A%2F%2Fgithub.com%2Fopencv%2Fopencv%2Fblob%2F6791284994dee30c48ed7e234f4aa5f5caa8ce5e%2Fmodules%2Fcore%2Fsrc%2Fsystem.cpp%23L2583-L2633&style=default&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></script>

-----
