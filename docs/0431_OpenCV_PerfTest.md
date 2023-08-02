---
Title | OpenCV PerfTest
-- | --
Created @ | `2023-08-02T13:47:29Z`
Updated @| `2023-08-02T13:47:29Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/431)

---
# OpenCV Performance Test


## Build Test Case

- opencv_perf_calib3d
- opencv_perf_core
- opencv_perf_dnn
- opencv_perf_features2d
- opencv_perf_gapi
- opencv_perf_imgcodecs
- opencv_perf_imgproc
- opencv_perf_objdetect
- opencv_perf_photo
- opencv_perf_stitching
- opencv_perf_video
- opencv_perf_videoio

```
cmake -DCMAKE_BUILD_TYPE=Release -DBUILD_PERF_TESTS=ON ..
make 
```

## Run Test

```
./opencv_perf_core --gtest_output=xml
```

### Analyzing Result
- Scripts
  - run.py - tests runner - able to run tests on Windows, Linux, Android and Mac (is not tested yet).
  - report.py - prints all measurements from single test run in user-friendly way.
  - summary.py - creates comparison table for several test runs (able to compare different platforms or revisions).
  - chart.py - shows performance dependencies from test parameters (works on single log).


```
python ../../modules/ts/misc/report.py core.xml -o html|tee core.html
```

```
python3 ../../modules/ts/misc/summary.py core_cpu.xml core_igpu.xml -f absdiff:
```

![image](https://github.com/junxnone/aiwiki/assets/2216970/0cd26057-e853-466d-86b5-7d0da0fa29dc)

```
python3 ../../modules/ts/misc/chart.py core_cpu.xml -f absdiff:
```
![image](https://github.com/junxnone/aiwiki/assets/2216970/aa7615e4-f3e2-4cd9-bcd6-3ff5d4a29f2d)



## Reference
- [Running performance tests and analyzing the results](https://github.com/opencv/opencv/wiki/HowToUsePerfTests)
