require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./src/models/User"); // ajuste se o caminho for diferente

(async () => {
  try {
    console.log("🔗 Conectando ao MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const email = "levitamota+confianca@gmail.com";

    console.log("🔍 Buscando admin...");
    const user = await User.findOne({ "e-mail": email }).select("+senha");

    if (!user) {
      console.log("❌ Usuário não encontrado.");
      return;
    }

    console.log("✅ Usuário encontrado!");
    console.log("Hash armazenado:", user.senha);
    console.log("Tamanho:", user.senha.length);

    console.log("\n🔐 Testando senha...");
    const ok = await bcrypt.compare("Andre9157$", user.senha);

    console.log("\nResultado:");
    console.log("--------------------------");
    console.log("Senha correta? ", ok ? "✅ SIM" : "❌ NÃO");
    console.log("--------------------------");
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
})();
