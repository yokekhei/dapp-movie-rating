const MovieRatings = artifacts.require('./MovieRatings');
const EVM_REVERT = 'VM Exception while processing transaction: revert';

require('chai')
    .use(require('chai-as-promised'))
    .should();

contract('MovieRatings', ([deployer, user1, user2]) => {
    let dapp;

    beforeEach(async () => {
        dapp = await MovieRatings.new();
    })

    describe('deployment', () => {
        it('tracks the contract owner', async () => {
            let owner = await dapp.owner({ from: user1 });
            owner.should.equal(deployer);
        })
    })

    describe('fallback', () => {
        it('revert for unknown function call', async () => {
            await dapp.sendTransaction({ value: 1, from: user1 }).should.be.rejectedWith(EVM_REVERT);
        })
    })

    describe('function calls', () => {
        let result1;
        let result2;
        let result3;

        describe('add movie', () => {
            beforeEach(async () => {
                result1 = await dapp.addMovie('The Father', { from: deployer });
                result2 = await dapp.addMovie('Tom & Jerry', { from: deployer });
            })

            describe('success', async () => {
                it('tracks the added movie details', async () => {
                    // 1st movie, queried by deployer
                    let movie = await dapp.movies(0, { from: deployer });
                    movie.id.toString().should.equal('1');
                    movie.name.should.equal('The Father');
                    movie.totalRatings.toString().should.equal('0');
                    movie.totalScores.toString().should.equal('0');
    
                    // 2nd movie, queried by user1
                    movie = await dapp.movies(1, { from: user1 });
                    movie.id.toString().should.equal('2');
                    movie.name.should.equal('Tom & Jerry');
                    movie.totalRatings.toString().should.equal('0');
                    movie.totalScores.toString().should.equal('0');
                })
        
                it('emits a MovieAdded event', async () => {
                    // 1st movie
                    let log = result1.logs[0];
                    log.event.should.eq('MovieAdded');
                    let event = log.args;
                    event.movieId.toString().should.equal('1', 'movieId is correct');
                    event.name.should.equal('The Father', 'name is correct');
    
                    // 2nd movie
                    log = result2.logs[0];
                    log.event.should.eq('MovieAdded');
                    event = log.args;
                    event.movieId.toString().should.equal('2', 'movieId is correct');
                    event.name.should.equal('Tom & Jerry', 'name is correct');
                })
            })
    
            describe('failure', async () => {
                it('rejects invalid contract owner', async () => {
                    await dapp.addMovie('Godzilla Vs. Kong', { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                })

                it('rejects already added movie', async () => {
                    await dapp.addMovie('The Father', { from: deployer }).should.be.rejectedWith(EVM_REVERT);
                })
            })
        })
    
        describe('get movies count', () => {
            beforeEach(async () => {
                await dapp.addMovie('The Father', { from: deployer });
                await dapp.addMovie('Tom & Jerry', { from: deployer });
            })

            it('tracks the number of movies', async () => {
                let totalMovies = await dapp.getMoviesCount({ from: user1 });
                totalMovies.toString().should.equal('2');
            })
        })
    
        describe('get movie', () => {
            beforeEach(async () => {
                await dapp.addMovie('The Father', { from: deployer });
                await dapp.addMovie('Tom & Jerry', { from: deployer });
            })

            describe('success', async () => {
                it('tracks the movie details', async () => {
                    // 1st movie, queried by deployer
                    let movie = await dapp.getMovie(1, { from: deployer });
                    movie.id_.toString().should.equal('1');
                    movie.name_.should.equal('The Father');
                    movie.totalRatings_.toString().should.equal('0');
                    movie.totalScores_.toString().should.equal('0');
    
                    // 2nd movie, queried by user1
                    movie = await dapp.getMovie(2, { from: user1 });
                    movie.id_.toString().should.equal('2');
                    movie.name_.should.equal('Tom & Jerry');
                    movie.totalRatings_.toString().should.equal('0');
                    movie.totalScores_.toString().should.equal('0');
                })
            })
    
            describe('failure', async () => {
                it('rejects movie id 0', async () => {
                    await dapp.getMovie(0, { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                })
    
                it('rejects movie id greater than total number of movies', async () => {
                    await dapp.getMovie(3, { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                })
            })
        })
    
        describe('rate movie', () => {
            beforeEach(async () => {
                await dapp.addMovie('The Father', { from: deployer });
                await dapp.addMovie('Tom & Jerry', { from: deployer });
                result1 = await dapp.rateMovie(1, 4, 'happy and blessed', { from: deployer });
                result2 = await dapp.rateMovie(2, 5, 'funny', { from: user1 });
                result3 = await dapp.rateMovie(2, 3, 'cute', { from: user2 });
            })
    
            describe('success', async () => {
                it('tracks the review details', async () => {
                    // 1st review by deployer
                    let review = await dapp.reviews(1, deployer, { from: deployer });
                    review.id.toString().should.equal('1');
                    review.movieId.toString().should.equal('1');
                    review.user.should.equal(deployer);
                    review.score.toString().should.equal('4');
                    review.text.should.equal('happy and blessed');
    
                    // 2nd review by user1
                    review = await dapp.reviews(2, user1, { from: user1 });
                    review.id.toString().should.equal('2');
                    review.movieId.toString().should.equal('2');
                    review.user.should.equal(user1);
                    review.score.toString().should.equal('5');
                    review.text.should.equal('funny');
    
                    // 3rd review by user2
                    review = await dapp.reviews(2, user2, { from: user2 });
                    review.id.toString().should.equal('3');
                    review.movieId.toString().should.equal('2');
                    review.user.should.equal(user2);
                    review.score.toString().should.equal('3');
                    review.text.should.equal('cute');
                })
    
                it('tracks review counter', async () => {
                    let count = await dapp.reviewCount({ from: user2 });
                    count.toString().should.equal('3');
                })

                it('tracks total ratings of a movie', async () => {
                    // 1st movie
                    let movie = await dapp.movies(0, { from: deployer });
                    movie.totalRatings.toString().should.equal('1');
                    
                    // 2nd movie
                    movie = await dapp.movies(1, { from: user1 });
                    movie.totalRatings.toString().should.equal('2');
                })

                it('tracks total scores of a movie', async () => {
                    // 1st movie
                    let movie = await dapp.movies(0, { from: deployer });
                    movie.totalScores.toString().should.equal('4');
                    
                    // 2nd movie
                    movie = await dapp.movies(1, { from: user2 });
                    movie.totalScores.toString().should.equal('8');
                })

                it('emits a MovieRated event', async () => {
                    // 1st movie review
                    let log = result1.logs[0];
                    log.event.should.eq('MovieRated');
                    let event = log.args;
                    event.reviewId.toString().should.equal('1', 'reviewId is correct');
                    event.movieId.toString().should.equal('1', 'movieId is correct');
                    event.user.should.equal(deployer, 'user is correct');
                    event.score.toString().should.equal('4', 'score is correct');
                    event.text.should.equal('happy and blessed', 'text is correct');
                    event.totalRatings.toString().should.equal('1', 'score is correct');
                    event.totalScores.toString().should.equal('4', 'score is correct');
    
                    // 2nd movie review
                    log = result2.logs[0];
                    log.event.should.eq('MovieRated');
                    event = log.args;
                    event.reviewId.toString().should.equal('2', 'reviewId is correct');
                    event.movieId.toString().should.equal('2', 'movieId is correct');
                    event.user.should.equal(user1, 'user is correct');
                    event.score.toString().should.equal('5', 'score is correct');
                    event.text.should.equal('funny', 'text is correct');
                    event.totalRatings.toString().should.equal('1', 'score is correct');
                    event.totalScores.toString().should.equal('5', 'score is correct');

                    // 3rd movie review
                    log = result3.logs[0];
                    log.event.should.eq('MovieRated');
                    event = log.args;
                    event.reviewId.toString().should.equal('3', 'reviewId is correct');
                    event.movieId.toString().should.equal('2', 'movieId is correct');
                    event.user.should.equal(user2, 'user is correct');
                    event.score.toString().should.equal('3', 'score is correct');
                    event.text.should.equal('cute', 'text is correct');
                    event.totalRatings.toString().should.equal('2', 'score is correct');
                    event.totalScores.toString().should.equal('8', 'score is correct');
                })
            })
    
            describe('failure', async () => {
                it('rejects movie id 0', async () => {
                    await dapp.rateMovie(0, 5, 'happy and blessed', { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                })
    
                it('rejects movie id greater than total number of movies', async () => {
                    await dapp.rateMovie(3, 5, 'funny', { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                })
    
                it('rejects out of range movie rating score', async () => {
                    await dapp.rateMovie(2, 6, 'funny', { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                })
    
                it('rejects already rated user', async () => {
                    await dapp.rateMovie(2, 4, 'cute', { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                })
            })
        })

        describe('get total ratings of a movie', () => {
            beforeEach(async () => {
                await dapp.addMovie('The Father', { from: deployer });
                await dapp.addMovie('Tom & Jerry', { from: deployer });
                await dapp.rateMovie(1, 4, 'happy and blessed', { from: deployer });
                await dapp.rateMovie(2, 5, 'funny', { from: user1 });
                await dapp.rateMovie(2, 3, 'cute', { from: user2 });
            })

            describe('success', async () => {
                it('tracks total ratings of a movie', async () => {
                    // 1st movie
                    let totalRatings = await dapp.totalRatings(1, { from: deployer });
                    totalRatings.toString().should.equal('1');
                    
                    // 2nd movie
                    totalRatings = await dapp.totalRatings(2, { from: user1 });
                    totalRatings.toString().should.equal('2');
                })
            })

            describe('failure', async () => {
                it('rejects movie id 0', async () => {
                    await dapp.totalRatings(0, { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                })
    
                it('rejects movie id greater than total number of movies', async () => {
                    await dapp.totalRatings(3, { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                })
            })
        })

        describe('get total scores of a movie', () => {
            beforeEach(async () => {
                await dapp.addMovie('The Father', { from: deployer });
                await dapp.addMovie('Tom & Jerry', { from: deployer });
                await dapp.rateMovie(1, 4, 'happy and blessed', { from: deployer });
                await dapp.rateMovie(2, 5, 'funny', { from: user1 });
                await dapp.rateMovie(2, 3, 'cute', { from: user2 });
            })

            describe('success', async () => {
                it('tracks total scores of a movie', async () => {
                    // 1st movie
                    let totalScores = await dapp.totalScores(1, { from: deployer });
                    totalScores.toString().should.equal('4');
                    
                    // 2nd movie
                    totalScores = await dapp.totalScores(2, { from: user1 });
                    totalScores.toString().should.equal('8');
                })
            })

            describe('failure', async () => {
                it('rejects movie id 0', async () => {
                    await dapp.totalScores(0, { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                })
    
                it('rejects movie id greater than total number of movies', async () => {
                    await dapp.totalScores(3, { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                })
            })
        })

        describe('get average score of a movie', () => {
            beforeEach(async () => {
                await dapp.addMovie('The Father', { from: deployer });
                await dapp.addMovie('Tom & Jerry', { from: deployer });
                await dapp.addMovie('Our Friend', { from: deployer });
                result1 = await dapp.rateMovie(1, 4, 'happy and blessed', { from: deployer });
                result2 = await dapp.rateMovie(2, 5, 'funny', { from: user1 });
                result3 = await dapp.rateMovie(2, 3, 'cute', { from: user2 });
            })

            describe('success', async () => {
                it('tracks average score of a movie', async () => {
                    // 1st movie
                    let averageScore = await dapp.averageScore(1, { from: deployer });
                    averageScore.toString().should.equal('4');
                    
                    // 2nd movie
                    averageScore = await dapp.averageScore(2, { from: user1 });
                    averageScore.toString().should.equal('4');
                })
            })

            describe('failure', async () => {
                it('rejects movie id 0', async () => {
                    await dapp.averageScore(0, { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                })
    
                it('rejects movie id greater than total number of movies', async () => {
                    await dapp.averageScore(4, { from: user1 }).should.be.rejectedWith(EVM_REVERT);
                })

                it('rejects getting average score from movie that is not rated yet', async () => {
                    await dapp.averageScore(3, { from: user2 }).should.be.rejectedWith(EVM_REVERT);
                })
            })
        })
    })
})