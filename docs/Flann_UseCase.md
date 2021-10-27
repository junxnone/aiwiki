---
Title | Flann UseCase
-- | --
Create Date | `2021-10-27T08:25:57Z`
Update Date | `2021-10-27T08:51:40Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/130)

---

## UseCase

```
namespace flann
{
    template<typename Distance>
    class Index 
    {
	typedef typename Distance::ElementType ElementType;
	typedef typename Distance::ResultType DistanceType;
    public:
        Index(const IndexParams& params, Distance distance = Distance() );
        
        Index(const Matrix<ElementType>& points, const IndexParams& params,
                Distance distance = Distance() );
	~Index();
	void buildIndex();        
        
        void buildIndex(const Matrix<ElementType>& points);
        
        void addPoints(const Matrix<ElementType>& points, 
                       float rebuild_threshold = 2);
        
        void removePoint(size_t point_id);
        
        ElementType* getPoint(size_t point_id);
	int knnSearch(const Matrix<ElementType>& queries, 
		       Matrix<int>& indices, 
		       Matrix<DistanceType>& dists, 
		       size_t knn, 
		       const SearchParams& params);
        int knnSearch(const Matrix<ElementType>& queries,
                       std::vector< std::vector<int> >& indices,
                       std::vector<std::vector<DistanceType> >& dists,
                       size_t knn,
                       const SearchParams& params);
	int radiusSearch(const Matrix<ElementType>& queries, 
			 Matrix<int>& indices, 
			 Matrix<DistanceType>& dists, 
			 float radius, 
			 const SearchParams& params);
        int radiusSearch(const Matrix<ElementType>& queries,
                          std::vector< std::vector<int> >& indices,
                          std::vector<std::vector<DistanceType> >& dists,
                          float radius,
                          const SearchParams& params);
	void save(std::string filename);
	int veclen() const;
	int size() const;
	IndexParams getParameters() const;
        flann_algorithm_t getType() const;
    };
}
```

## Index()
```
        Index(const IndexParams& params, Distance distance = Distance() );
        
        Index(const Matrix<ElementType>& points, const IndexParams& params,
                Distance distance = Distance() );
```

- **points**: `num features × dimensionality` features points
- **params**: Index 参数
  - LinearIndexParams
  - KDTreeIndexParams
  - KMeansIndexParams
  - CompositeIndexParams
  - KDTreeSingleIndexParams
  - KDTreeCuda3dIndexParams
  - LshIndexParams
  - AutotunedIndexParams
  - SavedIndexParams
