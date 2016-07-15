should = require 'should'
parse = if process.env.CSV_COV then require '../lib-cov' else require '../src/sync'

it 'Should parse empty fields to a predefined value', ->
    data = parse 'field_1,field_2\n,value 1\nname 2,value 2', columns: true
    data.should.eql [
      {'field_1': parse.empty_value, 'field_2': 'value 1'},
      {'field_1': 'name 2', 'field_2': 'value 2'}
    ]
