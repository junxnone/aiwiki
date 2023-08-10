-----

| Title     | OpenCV TAPI                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-08-10T14:58:14Z`                                |
| Updated @ | `2023-08-10T14:58:14Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/436) |

-----

# TAPI - Transparent API

  - 快速简便地使用 OpenCL + 硬件(GPU/DSP/FPGA/...)加速
  - `Mat` --\> `UMat(Unified Matrix)`
  - 适用于一些耗时操作
      - 简单快速的操作会因为 `memory copy` 导致耗时增加
  - `OpenCV 2.4` 时 开发了 `OpenCV OCL module`: 使用 `ocl namespace` 方式调用
      - `OpenCV 3` 时 `OCL module` 被放弃，使用 TAPI 替代

## Mat \<-\> UMat

### C++

    mat.copyTo(umat);

    UMat umat = mat.getUMat( flag );

> flag: ACCESS\_READ/ACCESS\_WRITE/ACCESS\_RW/ACCESS\_FAST

    mat = umat.getMat( flag )

### Python

    umat = cv2.UMat(mat)

    mat = cv2.UMat.get(umat)

## Reference

  - [OpenCV Transparent
    API](https://learnopencv.com/opencv-transparent-api/)
