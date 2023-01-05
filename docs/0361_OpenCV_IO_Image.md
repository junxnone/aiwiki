---
Title | OpenCV IO Image
-- | --
Created @ | `2018-12-11T05:52:41Z`
Updated @| `2023-01-05T06:53:40Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/361)

---
## Reference
- [关于cv2.imread()读取图像为BGR问题](https://blog.csdn.net/liu13364876993/article/details/79867061)

## Read Images
- [cv2.imread](https://docs.opencv.org/3.4.3/d4/da8/group__imgcodecs.html#ga288b8b3da0892bd651fce07b3bbd3a56)
- [cv::ImreadModes](https://docs.opencv.org/4.0.1/d4/da8/group__imgcodecs.html#ga61d9b0126a3e57d9277ac48327799c80)
- OpenCV 读取图像的格式 为 `BGR`, 而其他很多工具(matplotlib/...)需要 `RGB` format Image, 可以使用 `cv2.cvtColor()` 转换

```cpp
Mat cv::imread(const String & filename, int flags = IMREAD_COLOR)	
```
```python
retval = cv.imread( filename[, flags])
```


### Support Formats

- Windows bitmaps - *.bmp, *.dib (always supported)
- JPEG files - *.jpeg, *.jpg, *.jpe (see the Note section)
- JPEG 2000 files - *.jp2 (see the Note section)
- Portable Network Graphics - *.png (see the Note section)
- WebP - *.webp (see the Note section)
- Portable image format - *.pbm, *.pgm, *.ppm *.pxm, *.pnm (always supported)
- PFM files - *.pfm (see the Note section)
- Sun rasters - *.sr, *.ras (always supported)
- TIFF files - *.tiff, *.tif (see the Note section)
- OpenEXR Image files - *.exr (see the Note section)
- Radiance HDR - *.hdr, *.pic (always supported)
- Raster and Vector geospatial data supported by GDAL (see the Note section)

## Write Images

- `cv2.imwrite()`

```cpp
bool cv::imwrite( const String &  filename, InputArray 	img, const std::vector< int > &  params = std::vector< int >() )
```
```python
retval = cv.imwrite(filename, img[, params])
```


## BGR -> RGB

-  [ cv2.cvtColor](https://docs.opencv.org/3.4.3/d7/d1b/group__imgproc__misc.html#ga397ae87e1288a81d2363b61574eb8cab)
> Converts an image from one color space to another.  

- [ColorConversionCodes](https://docs.opencv.org/3.4.3/d7/d1b/group__imgproc__misc.html#ga4e0972be5de079fed4e3a10e24ef5ef0)
- [Color conversions](https://docs.opencv.org/3.4.3/de/d25/imgproc_color_conversions.html)

