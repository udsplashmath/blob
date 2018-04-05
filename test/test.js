/* eslint-env node,mocha */
const { assert, expect, should } = require("chai");

should();

describe("Array", function () {
  describe("#indexOf()", function () {
    it("should return -1 when the value is not present", function () {
      assert.equal(-1, [1, 2, 3].indexOf(4));
      assert.typeOf({a: 1}, "object");
      expect({a: 1}).to.have.property("a");
      "abc".should.contain("bc");
    });
  });
});