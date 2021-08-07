pragma solidity ^0.5.0;

/** 
 * @title MovieRatings
 * @dev Implements movie ratings process and keeps tracks of customer reviews
 */
contract MovieRatings {
    
    struct Movie {
        uint256 id;
        string name;
        uint256 totalRatings;
        uint256 totalScores;
    }
    
    struct Review {
        uint256 id;
        uint256 movieId;
        address user;
        uint8 score;
        string text;
        uint256 timestamp;
    }
    
    uint8 constant MIN_SCORE = 0;
    uint8 constant MAX_SCORE = 5;
    
    Movie[] public movies;
    address public owner;
    uint256 public reviewCount;
    mapping(uint256 => mapping(address => Review)) public reviews;

    event MovieAdded(uint256 movieId, string name);
    event MovieRated(
        uint256 reviewId,
        uint256 movieId,
        address indexed user,
        uint8 score,
        string text,
        uint256 totalRatings,
        uint256 totalScores,
        uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Invalid contract owner");
        _;
    }

    modifier restrictMovieId(uint256 _movieId) {
        require(_movieId > 0 && _movieId <= movies.length, "Invalid movie id");
        _;
    }
    
    /** 
     * @dev Create a new movie ratings application instance.
     */
    constructor() public {
        owner = msg.sender;
    }

     /** 
     * @dev Fallback function
     */
    function() external {
        revert();
    }

    /** 
     * @dev Compare two strings.
     * @param _a1 first string value
     * @param _a2 second string value
     * @return status_ true if two string values are equal, else false
     */
    function _stringsEqual(string memory _a1, string memory _a2) internal pure returns (bool status_) {
        return keccak256(bytes(_a1)) == keccak256(bytes(_a2)) ? true : false;
    }
    
    /** 
     * @dev Add movie to array.
     * @param _name movie name
     * @return movieId_ identity of the movie
     */
    function addMovie(string memory _name) public onlyOwner returns (uint256 movieId_) {
        for (uint256 i; i<movies.length; i++) {
            if (_stringsEqual(movies[i].name, _name)) {
                revert('Movie already exists');
            }
        }

        movies.push(Movie({
            id: movies.length + 1,
            name: _name,
            totalRatings: 0,
            totalScores: 0
        }));
        
        movieId_ = movies.length;
        emit MovieAdded(movieId_, _name);
    }

     /** 
     * @dev Get total number of movies.
     * @return count_ total number movies
     */
    function getMoviesCount() public view returns (uint256 count_) {
        return movies.length;
    }
    
    /** 
     * @dev Get details of the given movie.
     * @param _movieId identity of the movie
     * @return id_ identity of the movie
     * @return name_ name of the movie
     * @return totalRatings_ total number of ratings accumulated for the movie
     * @return totalScores_ total scores accumulated for the movie
     */
    function getMovie(uint256 _movieId) public view restrictMovieId(_movieId) returns 
        (uint256 id_, string memory name_, uint256 totalRatings_, uint256 totalScores_) {
        uint256 _idx = _movieId - 1;
        id_ = movies[_idx].id;
        name_ = movies[_idx].name;
        totalRatings_ = movies[_idx].totalRatings;
        totalScores_ = movies[_idx].totalScores;
    }

    /** 
     * @dev Rate the given movie.
     * @param _movieId identity of the movie
     * @param _score score of movie ranging from 0 to 5
     * @param _text movie reviews text
     */
    function rateMovie(uint256 _movieId, uint8 _score, string memory _text) public restrictMovieId(_movieId) {
        require(_score <= MAX_SCORE && _score >= MIN_SCORE, "Rating score out of range");
        Review storage _review = reviews[_movieId][msg.sender];
        require(address(_review.user) != msg.sender, "Already rated");
        
        uint256 _idx = _movieId - 1;
        reviewCount = reviewCount + 1;
        reviews[_movieId][msg.sender] = Review(reviewCount, _movieId, msg.sender, _score, _text, now);
        movies[_idx].totalRatings += 1;
        movies[_idx].totalScores += _score;

        emit MovieRated(reviewCount, _movieId, msg.sender, _score, _text,
            movies[_idx].totalRatings, movies[_idx].totalScores,
            reviews[_movieId][msg.sender].timestamp);
    }
    
    /** 
     * @dev Get total ratings of the given movie received so far.
     * @param _movieId identity of the movie
     * @return totalRatings_ total number of ratings of the movie
     */
    function totalRatings(uint256 _movieId) public view
        restrictMovieId(_movieId) returns (uint256 totalRatings_) {
        return movies[_movieId - 1].totalRatings;
    }

    /** 
     * @dev Get total scores of the given movie received so far.
     * @param _movieId identity of the movie
     * @return totalScores_ total scores of the movie
     */
    function totalScores(uint256 _movieId) public view
        restrictMovieId(_movieId) returns (uint256 totalScores_) {
        return movies[_movieId - 1].totalScores;
    }

    /** 
     * @dev Get average score of the given movie received so far.
     * @param _movieId identity of the movie
     * @return averageScore_ average score of the movie
     */
    function averageScore(uint256 _movieId) public view
        restrictMovieId(_movieId) returns (uint256 averageScores_) {
        require(movies[_movieId - 1].totalRatings > 0, "No ratings yet");

        return movies[_movieId - 1].totalScores/movies[_movieId - 1].totalRatings;
    }
}