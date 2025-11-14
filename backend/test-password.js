// test-password.js
const bcrypt = require('bcryptjs');

(async () => {
  try {
    // ✅ 1. ALTERE A SENHA AQUI (texto puro)
    const plainPassword = "SUA_SENHA_AQUI"; 
    
    // ✅ 2. COLE AQUI O HASH EXATO DO ATLAS
    const hashFromDatabase = "COLE_O_HASH_AQUI";

    console.log("🔍 Testando senha...");
    const match = await bcrypt.compare(plainPassword, hashFromDatabase);

    console.log("\nResultado:");
    console.log("----------------------------");
    console.log("Senha correta? ", match ? "✅ SIM" : "❌ NÃO");
    console.log("----------------------------\n");

    if (!match) {
      console.log("Possíveis causas:");
      console.log("1️⃣ Hash no banco não é bcrypt válido");
      console.log("2️⃣ Senha incorreta");
      console.log("3️⃣ Hash foi gerado com outra lib");
      console.log("4️⃣ Espaços extras (atenção ao copiar)");
    }

  } catch (err) {
    console.error("Erro ao comparar:", err);
  }
})();
