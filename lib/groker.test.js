"use strict";

var _ = require('dry-underscore');
var groker = require('..');

var eq = _.test.eq;
var ok = _.test.ok;

var omit_grok = _.partial(_.map, _, _.partial(_.omit, _, "grok"));

suite("groker");

test("blah", function(){
    eq([{ a: true },{}], omit_grok([{grok: {}, a: true}, { grok: {} }]));
});

test("grok", function(done){

    var g = new groker();

    var i = 0;

    g.processor(function(next, row){
        row.number = i++;
        next();
    });

    g.processor(function(next, row){
        row.double_number = row.number * 2;
        next();
    });

    var rows = [{}, {}, {}];

    g.grok(rows, function(err){
        eq(omit_grok(rows), [{ number: 0, double_number: 0 }, { number: 1, double_number: 2 }, { number: 2, double_number: 4 }]);
        done();
    });
});

test("grok options", function(done){

    var g = new groker();

    var i = 0;

    g.processor(function(next, row, options){
        row.number = (options.start + i++);
        next();
    });

    var rows = [{}, {}, {}];

    g.grok(rows, { start: 4 }, function(err){
        eq(omit_grok(rows), [{ number: 4 }, { number: 5 }, { number: 6 }]);
        done();
    });
});


test("error", function(done){
    var g = new groker();

    var i = 0;

    g.processor(function(next, row){
        row.number = i++;
        next();
    });

    g.processor(function(next, row){
        next({ type: 'foo_error' });
    });

    var rows = [{},{}];

    g.grok(rows, function(err){
        eq(err, { type: 'foo_error' });
        done();
    });
});

test("date", function(done){

    var g = new groker();

    g.dates(true);

    var rows = [{ date: '2016-01-05' }, { date: '3017-12-02' }, {}];

    g.grok(rows, function(err){

        eq(true, rows[0].grok.date.relative.days < 0);
        eq(true, rows[0].grok.date.relative.years < 0);
        eq(true, rows[0].grok.date.relative.quarters < 0);

        eq(rows[0].grok.date.relative.days, _.iso_date(rows[0].date).diff(_.moment(), 'days'));

        eq(rows[0].grok.date.fixed.day, 5);

        eq(true, rows[1].grok.date.relative.days > 0);
        eq(true, rows[1].grok.date.relative.years > 0);
        eq(true, rows[1].grok.date.relative.quarters > 0);

        eq(rows[2], { grok: { date: { invalid: true } }  });

        done();
    });
});

test("date origin", function(done){

    var g = new groker();

    g.dates(true);

    var rows = [{ date: '2017-12-01' }, { date: '2017-12-02' }, {}];

    g.grok(rows, { date: '2000-01-01' }, function(err){

        var row = { date: '2017-12-01', grok: { date: {
            now: false,
            relative: { 
                days: 6544,
                rolling: { '7': 934, '14': 467, '21': 311, '28': 233 },
                quarters: 71,
                years: 17 
            },
            fixed: { day: 335, week_day: 5, month: 11, quarter: 4, year: 2017 } 
        } } };

        rows[0].grok.date = _.omit(rows[0].grok.date, ["moment", "origin"]);

        eq(rows[0], row);

        done();
    });
});
































