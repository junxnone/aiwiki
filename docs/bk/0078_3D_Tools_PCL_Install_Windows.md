-----

| Title         | 3D Tools PCL Install Windows                         |
| ------------- | ---------------------------------------------------- |
| Created @     | `2021-05-19T02:16:51Z`                               |
| Last Modify @ | `2022-12-25T03:58:34Z`                               |
| Labels        | \`\`                                                 |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/78) |

-----

# Build PCL with Windows

## Reference

  - [Building PCL’s dependencies from source on
    Windows](https://pcl-tutorials.readthedocs.io/en/latest/compiling_pcl_dependencies_windows.html#compiling-pcl-dependencies-windows)

## Brief

  - **Downloads Dependencies for pcl-1.11.1** `下载安装包安装或者源码编译安装`
      - [boost 1.74](https://www.boost.org/users/history/)
      - [Eigen 3.3.9](https://eigen.tuxfamily.org/index.php?title=Main_Page)
      - [flann 1.9.1](https://github.com/flann-lib/flann/releases)
      - [vtk 8.2](https://vtk.org/files/release/8.2/VTK-8.2.0.tar.gz)
      - `optional`
          - [qhull 2020.1](https://github.com/qhull/qhull/releases)
          - [googletest 1.10.0](https://github.com/google/googletest/releases)

## Steps

  - 使用 CMake 生成 VS solution

## Window project configs

### Include

    C:\Program Files\PCL 1.11.1\include\pcl-1.11
    C:\Program Files\PCL 1.11.1\3rdParty\Boost\include\boost-1_74
    C:\Program Files\PCL 1.11.1\3rdParty\FLANN\include
    C:\Program Files\PCL 1.11.1\3rdParty\Qhull\include
    C:\Program Files\PCL 1.11.1\3rdParty\VTK\include\vtk-8.2
    C:\Program Files\PCL 1.11.1\3rdParty\Eigen\eigen3
    C:\Program Files\OpenNI2\Include

### Lib

    C:\Program Files\PCL 1.11.1\lib
    C:\Program Files\PCL 1.11.1\3rdParty\Boost\lib
    C:\Program Files\PCL 1.11.1\3rdParty\FLANN\lib
    C:\Program Files\PCL 1.11.1\3rdParty\Qhull\lib
    C:\Program Files\PCL 1.11.1\3rdParty\VTK\lib
    C:\Program Files\OpenNI2\Lib

### Link

    OpenNI2.lib
    vtkChartsCore-8.2-gd.lib
    vtkChartsCore-8.2.lib
    vtkCommonColor-8.2-gd.lib
    vtkCommonColor-8.2.lib
    vtkCommonComputationalGeometry-8.2-gd.lib
    vtkCommonComputationalGeometry-8.2.lib
    vtkCommonCore-8.2-gd.lib
    vtkCommonCore-8.2.lib
    vtkCommonDataModel-8.2-gd.lib
    vtkCommonDataModel-8.2.lib
    vtkCommonExecutionModel-8.2-gd.lib
    vtkCommonExecutionModel-8.2.lib
    vtkCommonMath-8.2-gd.lib
    vtkCommonMath-8.2.lib
    vtkCommonMisc-8.2-gd.lib
    vtkCommonMisc-8.2.lib
    vtkCommonSystem-8.2-gd.lib
    vtkCommonSystem-8.2.lib
    vtkCommonTransforms-8.2-gd.lib
    vtkCommonTransforms-8.2.lib
    vtkDICOMParser-8.2-gd.lib
    vtkDICOMParser-8.2.lib
    vtkDomainsChemistry-8.2-gd.lib
    vtkDomainsChemistry-8.2.lib
    vtkDomainsChemistryOpenGL2-8.2-gd.lib
    vtkDomainsChemistryOpenGL2-8.2.lib
    vtkdoubleconversion-8.2-gd.lib
    vtkdoubleconversion-8.2.lib
    vtkexodusII-8.2-gd.lib
    vtkexodusII-8.2.lib
    vtkexpat-8.2-gd.lib
    vtkexpat-8.2.lib
    vtkFiltersAMR-8.2-gd.lib
    vtkFiltersAMR-8.2.lib
    vtkFiltersCore-8.2-gd.lib
    vtkFiltersCore-8.2.lib
    vtkFiltersExtraction-8.2-gd.lib
    vtkFiltersExtraction-8.2.lib
    vtkFiltersFlowPaths-8.2-gd.lib
    vtkFiltersFlowPaths-8.2.lib
    vtkFiltersGeneral-8.2-gd.lib
    vtkFiltersGeneral-8.2.lib
    vtkFiltersGeneric-8.2-gd.lib
    vtkFiltersGeneric-8.2.lib
    vtkFiltersGeometry-8.2-gd.lib
    vtkFiltersGeometry-8.2.lib
    vtkFiltersHybrid-8.2-gd.lib
    vtkFiltersHybrid-8.2.lib
    vtkFiltersHyperTree-8.2-gd.lib
    vtkFiltersHyperTree-8.2.lib
    vtkFiltersImaging-8.2-gd.lib
    vtkFiltersImaging-8.2.lib
    vtkFiltersModeling-8.2-gd.lib
    vtkFiltersModeling-8.2.lib
    vtkFiltersParallel-8.2-gd.lib
    vtkFiltersParallel-8.2.lib
    vtkFiltersParallelImaging-8.2-gd.lib
    vtkFiltersParallelImaging-8.2.lib
    vtkFiltersPoints-8.2-gd.lib
    vtkFiltersPoints-8.2.lib
    vtkFiltersProgrammable-8.2-gd.lib
    vtkFiltersProgrammable-8.2.lib
    vtkFiltersSelection-8.2-gd.lib
    vtkFiltersSelection-8.2.lib
    vtkFiltersSMP-8.2-gd.lib
    vtkFiltersSMP-8.2.lib
    vtkFiltersSources-8.2-gd.lib
    vtkFiltersSources-8.2.lib
    vtkFiltersStatistics-8.2-gd.lib
    vtkFiltersStatistics-8.2.lib
    vtkFiltersTexture-8.2-gd.lib
    vtkFiltersTexture-8.2.lib
    vtkFiltersTopology-8.2-gd.lib
    vtkFiltersTopology-8.2.lib
    vtkFiltersVerdict-8.2-gd.lib
    vtkFiltersVerdict-8.2.lib
    vtkfreetype-8.2-gd.lib
    vtkfreetype-8.2.lib
    vtkGeovisCore-8.2-gd.lib
    vtkGeovisCore-8.2.lib
    vtkgl2ps-8.2-gd.lib
    vtkgl2ps-8.2.lib
    vtkglew-8.2-gd.lib
    vtkglew-8.2.lib
    vtkGUISupportMFC-8.2-gd.lib
    vtkGUISupportMFC-8.2.lib
    vtkhdf5-8.2-gd.lib
    vtkhdf5-8.2.lib
    vtkhdf5_hl-8.2-gd.lib
    vtkhdf5_hl-8.2.lib
    vtkImagingColor-8.2-gd.lib
    vtkImagingColor-8.2.lib
    vtkImagingCore-8.2-gd.lib
    vtkImagingCore-8.2.lib
    vtkImagingFourier-8.2-gd.lib
    vtkImagingFourier-8.2.lib
    vtkImagingGeneral-8.2-gd.lib
    vtkImagingGeneral-8.2.lib
    vtkImagingHybrid-8.2-gd.lib
    vtkImagingHybrid-8.2.lib
    vtkImagingMath-8.2-gd.lib
    vtkImagingMath-8.2.lib
    vtkImagingMorphological-8.2-gd.lib
    vtkImagingMorphological-8.2.lib
    vtkImagingSources-8.2-gd.lib
    vtkImagingSources-8.2.lib
    vtkImagingStatistics-8.2-gd.lib
    vtkImagingStatistics-8.2.lib
    vtkImagingStencil-8.2-gd.lib
    vtkImagingStencil-8.2.lib
    vtkInfovisCore-8.2-gd.lib
    vtkInfovisCore-8.2.lib
    vtkInfovisLayout-8.2-gd.lib
    vtkInfovisLayout-8.2.lib
    vtkInteractionImage-8.2-gd.lib
    vtkInteractionImage-8.2.lib
    vtkInteractionStyle-8.2-gd.lib
    vtkInteractionStyle-8.2.lib
    vtkInteractionWidgets-8.2-gd.lib
    vtkInteractionWidgets-8.2.lib
    vtkIOAMR-8.2-gd.lib
    vtkIOAMR-8.2.lib
    vtkIOAsynchronous-8.2-gd.lib
    vtkIOAsynchronous-8.2.lib
    vtkIOCityGML-8.2-gd.lib
    vtkIOCityGML-8.2.lib
    vtkIOCore-8.2-gd.lib
    vtkIOCore-8.2.lib
    vtkIOEnSight-8.2-gd.lib
    vtkIOEnSight-8.2.lib
    vtkIOExodus-8.2-gd.lib
    vtkIOExodus-8.2.lib
    vtkIOExport-8.2-gd.lib
    vtkIOExport-8.2.lib
    vtkIOExportOpenGL2-8.2-gd.lib
    vtkIOExportOpenGL2-8.2.lib
    vtkIOExportPDF-8.2-gd.lib
    vtkIOExportPDF-8.2.lib
    vtkIOGeometry-8.2-gd.lib
    vtkIOGeometry-8.2.lib
    vtkIOImage-8.2-gd.lib
    vtkIOImage-8.2.lib
    vtkIOImport-8.2-gd.lib
    vtkIOImport-8.2.lib
    vtkIOInfovis-8.2-gd.lib
    vtkIOInfovis-8.2.lib
    vtkIOLegacy-8.2-gd.lib
    vtkIOLegacy-8.2.lib
    vtkIOLSDyna-8.2-gd.lib
    vtkIOLSDyna-8.2.lib
    vtkIOMINC-8.2-gd.lib
    vtkIOMINC-8.2.lib
    vtkIOMovie-8.2-gd.lib
    vtkIOMovie-8.2.lib
    vtkIONetCDF-8.2-gd.lib
    vtkIONetCDF-8.2.lib
    vtkIOParallel-8.2-gd.lib
    vtkIOParallel-8.2.lib
    vtkIOParallelXML-8.2-gd.lib
    vtkIOParallelXML-8.2.lib
    vtkIOPLY-8.2-gd.lib
    vtkIOPLY-8.2.lib
    vtkIOSegY-8.2-gd.lib
    vtkIOSegY-8.2.lib
    vtkIOSQL-8.2-gd.lib
    vtkIOSQL-8.2.lib
    vtkIOTecplotTable-8.2-gd.lib
    vtkIOTecplotTable-8.2.lib
    vtkIOVeraOut-8.2-gd.lib
    vtkIOVeraOut-8.2.lib
    vtkIOVideo-8.2-gd.lib
    vtkIOVideo-8.2.lib
    vtkIOXML-8.2-gd.lib
    vtkIOXML-8.2.lib
    vtkIOXMLParser-8.2-gd.lib
    vtkIOXMLParser-8.2.lib
    vtkjpeg-8.2-gd.lib
    vtkjpeg-8.2.lib
    vtkjsoncpp-8.2-gd.lib
    vtkjsoncpp-8.2.lib
    vtklibharu-8.2-gd.lib
    vtklibharu-8.2.lib
    vtklibxml2-8.2-gd.lib
    vtklibxml2-8.2.lib
    vtklz4-8.2-gd.lib
    vtklz4-8.2.lib
    vtklzma-8.2-gd.lib
    vtklzma-8.2.lib
    vtkmetaio-8.2-gd.lib
    vtkmetaio-8.2.lib
    vtkNetCDF-8.2-gd.lib
    vtkNetCDF-8.2.lib
    vtkogg-8.2-gd.lib
    vtkogg-8.2.lib
    vtkParallelCore-8.2-gd.lib
    vtkParallelCore-8.2.lib
    vtkpng-8.2-gd.lib
    vtkpng-8.2.lib
    vtkproj-8.2-gd.lib
    vtkproj-8.2.lib
    vtkpugixml-8.2-gd.lib
    vtkpugixml-8.2.lib
    vtkRenderingAnnotation-8.2-gd.lib
    vtkRenderingAnnotation-8.2.lib
    vtkRenderingContext2D-8.2-gd.lib
    vtkRenderingContext2D-8.2.lib
    vtkRenderingContextOpenGL2-8.2-gd.lib
    vtkRenderingContextOpenGL2-8.2.lib
    vtkRenderingCore-8.2-gd.lib
    vtkRenderingCore-8.2.lib
    vtkRenderingExternal-8.2-gd.lib
    vtkRenderingExternal-8.2.lib
    vtkRenderingFreeType-8.2-gd.lib
    vtkRenderingFreeType-8.2.lib
    vtkRenderingGL2PSOpenGL2-8.2-gd.lib
    vtkRenderingGL2PSOpenGL2-8.2.lib
    vtkRenderingImage-8.2-gd.lib
    vtkRenderingImage-8.2.lib
    vtkRenderingLabel-8.2-gd.lib
    vtkRenderingLabel-8.2.lib
    vtkRenderingLOD-8.2-gd.lib
    vtkRenderingLOD-8.2.lib
    vtkRenderingOpenGL2-8.2-gd.lib
    vtkRenderingOpenGL2-8.2.lib
    vtkRenderingVolume-8.2-gd.lib
    vtkRenderingVolume-8.2.lib
    vtkRenderingVolumeOpenGL2-8.2-gd.lib
    vtkRenderingVolumeOpenGL2-8.2.lib
    vtksqlite-8.2-gd.lib
    vtksqlite-8.2.lib
    vtksys-8.2-gd.lib
    vtksys-8.2.lib
    vtktheora-8.2-gd.lib
    vtktheora-8.2.lib
    vtktiff-8.2-gd.lib
    vtktiff-8.2.lib
    vtkverdict-8.2-gd.lib
    vtkverdict-8.2.lib
    vtkViewsContext2D-8.2-gd.lib
    vtkViewsContext2D-8.2.lib
    vtkViewsCore-8.2-gd.lib
    vtkViewsCore-8.2.lib
    vtkViewsInfovis-8.2-gd.lib
    vtkViewsInfovis-8.2.lib
    vtkzlib-8.2-gd.lib
    vtkzlib-8.2.lib
    pcl_commond.lib
    pcl_featuresd.lib
    pcl_filtersd.lib
    pcl_iod.lib
    pcl_io_plyd.lib
    pcl_kdtreed.lib
    pcl_keypointsd.lib
    pcl_mld.lib
    pcl_octreed.lib
    pcl_outofcored.lib
    pcl_peopled.lib
    pcl_recognitiond.lib
    pcl_registrationd.lib
    pcl_sample_consensusd.lib
    pcl_searchd.lib
    pcl_segmentationd.lib
    pcl_stereod.lib
    pcl_surfaced.lib
    pcl_trackingd.lib
    pcl_visualizationd.lib
