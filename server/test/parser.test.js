const { test } = require("node:test");
const assert = require("node:assert");
const { parseSMS } = require("../src/services/smsParser");

// 8 modeles SMS (Orange, MVola, Airtel — depot + retrait) — mihazona ny 8/8
const cas = [
  {
    nom: "Orange depot (paiement)",
    sms: "Le paiement de 5 000 Ar par le 0321234567 est reussi. Trans Id : PP123456.0",
    operator: "orange",
    type: "depot",
    montant: 5000,
  },
  {
    nom: "Orange depot (transfert recu)",
    sms: "Vous avez recu un transfert de 10 000Ar venant du 0321234567. Nouveau Solde: 50 000Ar. Trans Id: PP1.2",
    operator: "orange",
    type: "depot",
    montant: 10000,
  },
  {
    nom: "Orange retrait (depot pour client)",
    sms: "Depot de 20 000 Ar pour RAKOTO (0321234567) reussi. Nouveau solde: 30 000 Ar. Trans Id: PP2.3",
    operator: "orange",
    type: "retrait",
    montant: 20000,
  },
  {
    nom: "Orange retrait (transfert vers)",
    sms: "Votre transfert de 15 000 Ar vers 0321234567 est reussi. Frais: 200 Ar. Nouveau Solde: 12 000 Ar. Trans Id: PP3.4",
    operator: "orange",
    type: "retrait",
    montant: 15000,
  },
  {
    nom: "MVola depot",
    sms: "5 000 Ar recu de RAKOTO Jean 0341234567 le 01/01/24 a 10:00. Solde: 25 000 Ar. Ref: 123456789",
    operator: "mvola",
    type: "depot",
    montant: 5000,
  },
  {
    nom: "MVola retrait",
    sms: "10 000 Ar envoye a RABE Paul 0341234567 le 01/01/24 a 11:00. Frais: 100 Ar. Solde: 15 000 Ar. Ref: 987654321",
    operator: "mvola",
    type: "retrait",
    montant: 10000,
  },
  {
    nom: "Airtel depot",
    sms: "Vous avez recu Ar 5000 de RANAIVO 0331234567. Solde: Ar 20000.00. Id: TXN123",
    operator: "airtel",
    type: "depot",
    montant: 5000,
  },
  {
    nom: "Airtel retrait",
    sms: "Ar 10000 ENVOYE a RASOA 0331234567. Solde: Ar 9000.00. Frais: Ar 100. Id: TXN456",
    operator: "airtel",
    type: "retrait",
    montant: 10000,
  },
];

for (const c of cas) {
  test(c.nom, () => {
    const r = parseSMS(c.sms);
    assert.strictEqual(r.success, true, "tokony parsed");
    assert.strictEqual(r.operator, c.operator, "operator");
    assert.strictEqual(r.type, c.type, "type");
    assert.strictEqual(r.montant, c.montant, "montant");
    assert.ok(r.trans_id, "tokony misy trans_id");
  });
}

test("SMS tsy fantatra → success:false", () => {
  const r = parseSMS("Bonjour, manao ahoana ianao?");
  assert.strictEqual(r.success, false);
});
