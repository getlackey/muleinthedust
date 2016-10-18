/* jslint mocha:true, node:true, esnext:true, -W030, -W098 */
'use strict';

const
    should = require('should'),
    library = require('../lib'),
    instance = library({
        root: __dirname + '/mockups',
        onRoute: (route) => Promise.resolve({
            path: route,
            name: route + ' name',
            data: {
                a: '123123'
            },
            template: 'block2'
        })
    }),
    ctx = {
        top: 'up',
        item: {
            inner: 'it is',
            in : {
                the: {
                    list: [{
                        name: 'A'
                        }, {
                        name: 'B',
                        $idx: 1000
                        }, {
                        name: 'C'
                        }, {
                        name: 'D'
                        }, null, {
                        name: 'F'
                        }]
                }
            }
        },
        block: [{
            name: 'A',
            template: '_partials/block'
        }, {
            name: 'B'
        }, {
            name: 'C'
        }, {
            name: 'D'
        }, {
            name: 'E'
        }]
    };

describe('Helpers', () => {

    it('@path', done => {
        instance('path', ctx, (error, result) => {
            if (error) {
                return done(error);
            }
            try {
                result.should.be.String;
                result.replace(/^\s+|\s+$/g, '').should.be.eql(`TOP
up
ITEM INNER
it is
ITEM IN THE LIST 4
A
ITEM IN THE LIST 5
F
FOR
FOR 0
 A
FOR 1
1000 B
FOR 2
 C
FOR 3
 D
FOR 4
 not found
FOR 5
 F
FOR 6
 not found
FOR 7
 not found
FOR 8
 not found
FOR 9
 not found
FOR 10
 not found`);
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('@has', done => {
        instance('has', ctx, (error, result) => {
            if (error) {
                return done(error);
            }
            try {
                result.should.be.String;
                result.replace(/\s+/g, '').should.be.eql('TOP[objectObject]ITEMINNER[objectObject]ITEMINTHELIST4ITEMINTHELIST5FORFOR00FOR11FOR22FOR33FOR44notfoundFOR55FOR66notfoundFOR77notfoundFOR88notfoundFOR99notfoundFOR1010notfound');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('@block', done => {
        instance('block', ctx, (error, result) => {
            if (error) {
                return done(error);
            }
            try {
                result.should.be.String;
                result.replace(/^\s+|\s+$/g, '').should.be.eql('<block>A</block><!-- No template defined --><block2>block2 name</block2><block2>D</block2>');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

});
