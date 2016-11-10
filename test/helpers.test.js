/* jslint mocha:true, node:true, esnext:true, -W030, -W098 */
'use strict';

const
    should = require('should'),
    library = require('../lib'),
    fs = require('fs'),
    ctx = require('./context.json');

let
    instance = library({
        root: __dirname + '/mockups',
    });

instance.resolvers.route = (route) => Promise.resolve({
    path: route,
    name: route + ' name',
    data: {
        a: '123123'
    },
    template: 'block2'
});

function resultMockup(name) {
    return fs.readFileSync(__dirname + '/mockups/' + name + '.test.html', 'utf8').replace(/^\s+|\s+$/g, '');
}

describe('Helpers', () => {

    describe('@for', () => {
        it('@for', done => {
            instance('for', {
                A: 'King Kong'
            }, (error, result) => {
                if (error) {
                    return done(error);
                }
                try {
                    result.should.be.String;
                    result.replace(/^\s+|\s+$/g, '').should.be.eql('3 - King Kong4 - King Kong5 - King Kong');
                    done();
                } catch (err) {
                    done(err);
                }

            });
        });

        it('@for with syntax', done => {
            instance('for-error', {
                A: 'King Kong'
            }, (error, result) => {
                try {
                    should.not.exist(error);
                    result.should.be.eql('');
                    done();
                } catch (err) {
                    done(err);
                }

            });
        });
    });

    describe('@path', () => {

        [{
            name: 'empty without else',
            mockup: 'path-empty',
            result: null
        }, {
            name: 'one level',
            mockup: 'path-one-level',
            result: 'up'
        }, {
            name: 'inner',
            mockup: 'path-inner',
            result: 'it is'
        }, {
            name: 'first element in the list',
            mockup: 'path-first-in-the-list',
            result: 'A'
        }, {
            name: 'fifth in the list',
            mockup: 'path-fifth-in-the-list',
            result: 'F'
        }, {
            name: 'for loop',
            mockup: 'path-for',
            result: 'FOR 0\n A\nFOR 1\n1000 B\nFOR 2\n C\nFOR 3\n D\nFOR 4\n not found\nFOR 5\n F\nFOR 6\n not found\nFOR 7\n not found\nFOR 8\n not found\nFOR 9\n not found\nFOR 10\n not found'
        }, {
            name: 'for loop',
            mockup: 'path-for-inject',
            result: 'FOR 0\n A\nFOR 1\n1000 B\nFOR 2\n2 C\nFOR 3\n3 D\nFOR 4\n4 not found\nFOR 5\n5 F\nFOR 6\n6 not found\nFOR 7\n7 not found\nFOR 8\n8 not found\nFOR 9\n9 not found\nFOR 10\n10 not found'
        }]
        .forEach(test => it(test.name, done => {
            instance(test.mockup, ctx, (error, result) => {
                if (error) {
                    return done(error);
                }
                try {
                    result.should.be.String;
                    if (test.result) {
                        result.replace(/^\s+|\s+$/g, '').should.be.eql(test.result);
                    } else {
                        console.log(result);
                    }
                    done();
                } catch (err) {
                    done(err);
                }
            });
        }));

        it('Handle errors in blockRender', done => {
            instance('path-error', ctx, (error, result) => {
                try {
                    should.not.exist(error);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });

        it('Path resolver', done => {

            let instance2 = library({
                pathResolver: path => {
                    return Promise.resolve(__dirname + '/mockups/' + path + '.dust');
                }
            });

            instance2('path-error', ctx, (error, result) => {
                try {
                    console.log(error);
                    should.not.exist(error);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });

    it('typeof filter', done => instance('typeof', ctx, (error, result) => {
        if (error) {
            return done(error);
        }
        try {
            result.should.be.String;
            result.replace(/\s+/g, '').should.be.eql(resultMockup('typeof'));
            done();
        } catch (err) {
            done(err);
        }
    }));


    it('@has', done => {
        instance('has', ctx, (error, result) => {
            if (error) {
                return done(error);
            }
            try {
                result.should.be.String;
                result.replace(/\s+/g, '').should.be.eql(resultMockup('has'));
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    describe('@block', () => {

        it('works', done => {
            instance('block', ctx, (error, result) => {
                if (error) {
                    return done(error);
                }
                try {
                    result.should.be.String;
                    result.replace(/^\s+|\s+$/g, '').should.be.eql(resultMockup('block'));
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });

        it('handle error #1', done => {

            let old = instance.resolvers.route;
            instance.resolvers.route = null;

            instance('block', ctx, (error, result) => {
                if (error) {
                    return done(error);
                }
                try {
                    result.should.be.String;
                    result.replace(/^\s+|\s+$/g, '').should.be.eql(resultMockup('block-error'));
                    done();
                } catch (err) {
                    done(err);
                } finally {
                    instance.resolvers.route = old;
                }
            });
        });
    });



    it('@list', done => {
        instance('list', ctx, (error, result) => {
            if (error) {
                return done(error);
            }
            try {
                result.should.be.String;
                result.replace(/^\s+|\s+$/g, '').should.be.eql(resultMockup('list'));
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('@variant', done => {
        instance('variant', ctx, (error, result) => {
            if (error) {
                return done(error);
            }
            try {
                result.should.be.String;
                result.replace(/^\s+|\s+$/g, '').replace(/\s+\n/g, '\n').should.be.eql(resultMockup('variant'));
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    /*it('@content', done => {
        instance('content', ctx, (error, result) => {
            if (error) {
                return done(error);
            }
            try {
                result.should.be.String;
                console.log(result);
                //result.replace(/^\s+|\s+$/g, '').should.be.eql(resultMockup('block'));
                done();
            } catch (err) {
                done(err);
            }
        });
    });*/
});
