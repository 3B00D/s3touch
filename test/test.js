var exec = require('child_process').exec;
var s3touch = require('../index.js');
var tape = require('tape');

tape('usage', function(assert) {
    assert.equal(s3touch.usage(), 'Usage: s3touch <s3 path>');
    assert.end();
});

tape('createMessage', function(assert) {
    s3touch.createMessage('mapbox-pxm', 'travis-s3touch/a.txt', function(err, message) {
        assert.ifError(err);
        assert.equal(typeof message, 'object');
        assert.deepEqual(Object.keys(message), ['Records']);
        assert.equal(Array.isArray(message.Records), true);
        assert.equal(message.Records.length, 1);
        message.Records.forEach(function(record) {
            assert.deepEqual(Object.keys(record), ['eventVersion', 'eventSource', 'awsRegion', 'eventTime', 'eventName', 's3']);
            assert.deepEqual(typeof record.s3, 'object');
            assert.deepEqual(record.s3.s3SchemaVersion, '1.0');
            assert.deepEqual(record.s3.bucket, { name: 'mapbox-pxm', arn: 'arn:aws:s3:::mapbox-pxm' });
            assert.deepEqual(record.s3.object, { key: 'travis-s3touch/a.txt', size: 0, eTag: 'd41d8cd98f00b204e9800998ecf8427e' });
        });
        assert.end();
    });
});

tape('touch: invalid url', function(assert) {
    s3touch.touch('not-an-s3-url', {}, function(err) {
        assert.equal(err.toString(), 'Error: Invalid S3 path "not-an-s3-url"');
        assert.end();
    });
});

tape('touch: no pathname', function(assert) {
    s3touch.touch('s3://bucketName', {}, function(err) {
        assert.equal(err.toString(), 'Error: Invalid S3 path "s3://bucketName"');
        assert.end();
    });
});

tape('touch: head 404', function(assert) {
    s3touch.touch('s3://mapbox-pxm/does-not-exist', {}, function(err) {
        assert.equal(err.toString(), 'Error: Could not HEAD object ("404")');
        assert.end();
    });
});

tape('touch: sends notification', function(assert) {
    s3touch.touch('s3://mapbox-pxm/travis-s3touch/a.txt', {}, function(err, data) {
        assert.ifError(err);
        assert.equal(typeof data, 'object');
        assert.equal(typeof data.MessageId, 'string');
        assert.equal(typeof data.ResponseMetadata, 'object');
        assert.end();
    });
});

tape('bin: usage', function(assert) {
    exec(__dirname + '/../s3touch', function(err, stdout, stderr) {
        assert.equal(stdout, s3touch.usage() + '\n');
        assert.equal(stderr, '');
        assert.end();
    });
});

tape('bin: touch one', function(assert) {
    exec(__dirname + '/../s3touch s3://mapbox-pxm/travis-s3touch/a.txt', function(err, stdout, stderr) {
        assert.equal(stdout, 'ok - s3://mapbox-pxm/travis-s3touch/a.txt\n');
        assert.equal(stderr, '');
        assert.end();
    });
});

tape('bin: touch multiple', function(assert) {
    exec(__dirname + '/../s3touch s3://mapbox-pxm/travis-s3touch/a.txt s3://mapbox-pxm/travis-s3touch/b.txt', function(err, stdout, stderr) {
        assert.equal(stdout, 'ok - s3://mapbox-pxm/travis-s3touch/a.txt\nok - s3://mapbox-pxm/travis-s3touch/b.txt\n');
        assert.equal(stderr, '');
        assert.end();
    });
});

