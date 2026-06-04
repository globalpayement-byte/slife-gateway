function parseAmount(str) {
  return parseFloat(str.replace(/\s/g, "").replace(",", "."));
}

function parseSMS(text) {
  const t = text.trim();

  let m = t.match(/Le paiement de ([\d\s]+) Ar par le (\d+) est reussi.*?Trans Id\s*:\s*([\w.]+)/i);
  if (m) return { success: true, operator: "orange", type: "depot", montant: parseAmount(m[1]), numero_client: m[2], trans_id: m[3], solde: null, frais: 0 };

  m = t.match(/recu un transfert de ([\d\s]+)Ar venant du (\d+).*?Nouveau Solde:\s*([\d\s]+)Ar.*?Trans Id:\s*([\w.]+)/i);
  if (m) return { success: true, operator: "orange", type: "depot", montant: parseAmount(m[1]), numero_client: m[2], solde: parseAmount(m[3]), trans_id: m[4], frais: 0 };

  m = t.match(/Depot de ([\d\s]+) Ar pour .*?\((\d+)\) reussi.*?Nouveau solde:\s*([\d\s]+) Ar.*?Trans Id:\s*([\w.]+)/i);
  if (m) return { success: true, operator: "orange", type: "retrait", montant: parseAmount(m[1]), numero_client: m[2], solde: parseAmount(m[3]), trans_id: m[4], frais: 0 };

  m = t.match(/transfert de ([\d\s]+) Ar vers (\d+) est reussi.*?Frais:\s*([\d\s]+) Ar.*?Nouveau Solde:\s*([\d\s]+) Ar.*?Trans Id:\s*([\w.]+)/i);
  if (m) return { success: true, operator: "orange", type: "retrait", montant: parseAmount(m[1]), numero_client: m[2], frais: parseAmount(m[3]), solde: parseAmount(m[4]), trans_id: m[5] };

  m = t.match(/([\d\s]+) Ar recu de (.+?) (\d+) le.*?Solde:\s*([\d\s]+) Ar.*?Ref\s*:\s*(\d+)/i);
  if (m) return { success: true, operator: "mvola", type: "depot", montant: parseAmount(m[1]), nom: m[2].trim(), numero_client: m[3], solde: parseAmount(m[4]), trans_id: m[5], frais: 0 };

  m = t.match(/([\d\s]+) Ar envoye a (.+?) (\d+) le.*?Frais:\s*([\d\s]+) Ar.*?Solde:\s*([\d\s]+) Ar.*?Ref:\s*(\d+)/i);
  if (m) return { success: true, operator: "mvola", type: "retrait", montant: parseAmount(m[1]), nom: m[2].trim(), numero_client: m[3], frais: parseAmount(m[4]), solde: parseAmount(m[5]), trans_id: m[6] };

  m = t.match(/recu Ar (\d+) de (.+?) (\d+).*?Solde:\s*Ar ([\d.]+).*?Id:\s*([\w.]+)/i);
  if (m) return { success: true, operator: "airtel", type: "depot", montant: parseAmount(m[1]), nom: m[2].trim(), numero_client: m[3], solde: parseFloat(m[4]), trans_id: m[5], frais: 0 };

  m = t.match(/Ar (\d+) ENVOYE a (.+?) (\d+).*?Solde:\s*Ar ([\d.]+).*?Frais:\s*Ar (\d+).*?Id:\s*([\w.]+)/i);
  if (m) return { success: true, operator: "airtel", type: "retrait", montant: parseAmount(m[1]), nom: m[2].trim(), numero_client: m[3], solde: parseFloat(m[4]), frais: parseAmount(m[5]), trans_id: m[6] };

  return { success: false, raw: t };
}

module.exports = { parseSMS };
