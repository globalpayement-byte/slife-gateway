const { test } = require("node:test");
const assert = require("node:assert");

const dbPath = require.resolve("../src/config/database");
let activeKeys = ["good-key"];
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: {
    pool: { query: async () => [activeKeys.map((k) => ({ cle: k }))] },
    testConnection: async () => {},
  },
};

const { requireApiKey } = require("../src/middleware/auth");

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

test("auth: tsy misy x-api-key → 401", async () => {
  const res = mockRes();
  let nexted = false;
  await requireApiKey({ get: () => undefined }, res, () => { nexted = true; });
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(nexted, false);
});

test("auth: key diso → 403", async () => {
  const res = mockRes();
  let nexted = false;
  await requireApiKey({ get: () => "bad-key" }, res, () => { nexted = true; });
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(nexted, false);
});

test("auth: key marina → next()", async () => {
  const res = mockRes();
  let nexted = false;
  await requireApiKey({ get: () => "good-key" }, res, () => { nexted = true; });
  assert.strictEqual(nexted, true);
  assert.strictEqual(res.statusCode, 200);
});
