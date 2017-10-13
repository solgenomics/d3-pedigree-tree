var tape = require("tape"),
    foo = require("../");

tape("Tape is doing it's thing.", function(test) {
  test.equal(42, 42);
  test.end();
});
