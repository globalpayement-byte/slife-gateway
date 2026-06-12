const { test } = require("node:test");
const assert = require("node:assert");

// --- Mock ny module database mialoha ny require an'ny services ---
const dbPath = require.resolve("../src/config/database");

let queryHandler = async () => [[]];
let connQueryHandler = async () => [[]];
const calls = { commit: 0, rollback: 0, release: 0, begin: 0 };

const fakeConn = {
  beginTransaction: async () => { calls.begin++; },
  query: async (sql, params) => connQueryHandler(sql, params),
  commit: async () => { calls.commit++; },
  rollback: async () => { calls.rollback++; },
  release: () => { calls.release++; },
};

const fakePool = {
  query: async (sql, params) => queryHandler(sql, params),
  getConnection: async () => fakeConn,
};

require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: { pool: fakePool, testConnection: async () => {} },
};

const { buildMessageId } = require("../src/utils/idempotency");
const { processSMS } = require("../src/services/orderMatcher");

function reset() {
  calls.commit = calls.rollback = calls.release = calls.begin = 0;
}

// ---------- Idempotency key ----------
test("buildMessageId: mampiasa message_id raha misy", () => {
  assert.strictEqual(buildMessageId({ message_id: "abc-123", corps: "x" }), "abc-123");
});

test("buildMessageId: mianina amin'ny trans_id raha tsy misy message_id", () => {
  assert.strictEqual(buildMessageId({ trans_id: "PP9.9", corps: "x" }), "trans:PP9.9");
});

test("buildMessageId: hash raha tsy misy na inona na inona", () => {
  const id = buildMessageId({ expediteur: "MVola", corps: "5000 Ar recu" });
  assert.match(id, /^sha:[0-9a-f]{64}$/);
  // stable: mitovy foana ho an'ny SMS mitovy
  assert.strictEqual(id, buildMessageId({ expediteur: "MVola", corps: "5000 Ar recu" }));
});

// ---------- processSMS: match atomique ----------
test("processSMS: mahita order mifanaraka → matched + commit", async () => {
  reset();
  connQueryHandler = async (sql) => {
    if (/SELECT id FROM transactions/i.test(sql)) return [[{ id: 42 }]];
    return [{}];
  };
  const r = await processSMS({
    messageId: "m1",
    expediteur: "Orange",
    corps: "...",
    parsed: { success: true, operator: "orange", type: "depot", montant: 5000, solde: 10000, frais: 0 },
  });
  assert.strictEqual(r.matched, true);
  assert.strictEqual(r.transactionId, 42);
  assert.strictEqual(r.duplicate, false);
  assert.strictEqual(calls.commit, 1);
  assert.strictEqual(calls.rollback, 0);
  assert.strictEqual(calls.release, 1);
});

test("processSMS: tsy misy order → tsy matched fa mbola commit (SMS voatahiry)", async () => {
  reset();
  connQueryHandler = async (sql) => {
    if (/SELECT id FROM transactions/i.test(sql)) return [[]];
    return [{}];
  };
  const r = await processSMS({
    messageId: "m2",
    parsed: { success: true, operator: "mvola", type: "depot", montant: 999, solde: null, frais: 0 },
  });
  assert.strictEqual(r.matched, false);
  assert.strictEqual(r.transactionId, null);
  assert.strictEqual(calls.commit, 1);
});

// ---------- processSMS: idempotency (retry) ----------
test("processSMS: duplicate message_id (ER_DUP_ENTRY) → duplicate + rollback, tsy avo roa", async () => {
  reset();
  connQueryHandler = async (sql) => {
    if (/INSERT INTO sms_recus/i.test(sql)) {
      const e = new Error("Duplicate entry");
      e.code = "ER_DUP_ENTRY";
      throw e;
    }
    if (/SELECT id FROM transactions/i.test(sql)) return [[]];
    return [{}];
  };
  const r = await processSMS({
    messageId: "m-dup",
    parsed: { success: true, operator: "orange", type: "depot", montant: 5000, solde: null, frais: 0 },
  });
  assert.strictEqual(r.duplicate, true);
  assert.strictEqual(calls.commit, 0);
  assert.strictEqual(calls.rollback, 1);
  assert.strictEqual(calls.release, 1);
});

test("processSMS: SMS tsy parsed → voatahiry type 'autre', tsy match", async () => {
  reset();
  let inserted = null;
  connQueryHandler = async (sql, params) => {
    if (/INSERT INTO sms_recus/i.test(sql)) { inserted = params; return [{}]; }
    return [[]];
  };
  const r = await processSMS({
    messageId: "m3",
    operator: null,
    corps: "tsy fantatra",
    parsed: { success: false },
  });
  assert.strictEqual(r.matched, false);
  assert.strictEqual(calls.commit, 1);
  // type 'autre' (index 9 amin'ny params)
  assert.strictEqual(inserted[9], "autre");
});
