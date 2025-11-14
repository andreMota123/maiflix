const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcryptjs');

// 1) SUA URI DO ATLAS (troque <db_password> pela sua senha real do usuário levitamota)
const uri = "mongodb+srv://levitamota:Andre9157Mota@maiflix.qhg5rim.mongodb.net/?appName=Maiflix";

// 2) NOME DO BANCO E DA COLLECTION
const dbName = "maiflix";        // ajuste se seu banco tiver outro nome
const collectionName = "users";  // normalmente é "users"

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    console.log("🔗 Conectando ao MongoDB Atlas...");
    await client.connect();

    const db = client.db(dbName);
    const users = db.collection(collectionName);

    const email = "levitamota+finalsolucao@gmail.com";
    const plainPassword = "Andre9157$";

    // 1) Gera o hash da nova senha
    const hash = await bcrypt.hash(plainPassword, 10);
    console.log("🔐 Hash gerado (prefixo):", hash.slice(0, 7), "...");

    // 2) Cria/atualiza o admin
    const res = await users.updateOne(
      { 'e-mail': email.toLowerCase() },   // filtro
      {
        $set: {
          'e-mail': email.toLowerCase(),
          senha: hash,
          papel: 'admin',
          statusAssinatura: 'active',
        },
      },
      { upsert: true } // se não existir, cria
    );

    console.log("Resultado do update:", res.matchedCount, "encontrado(s),", res.modifiedCount, "modificado(s).");
    if (res.upsertedCount) {
      console.log("✅ Usuário criado com _id:", res.upsertedId);
    }

    // 3) Sanity check: ler de volta e comparar
    const user = await users.findOne({ 'e-mail': email.toLowerCase() });
    console.log("👀 Usuário no banco:", {
      email: user['e-mail'],
      papel: user.papel,
      statusAssinatura: user.statusAssinatura,
    });

    const ok = await bcrypt.compare(plainPassword, user.senha);
    console.log("Teste de senha com 'Andre9157$':", ok ? "✅ Bateu" : "❌ NÃO bateu");

  } catch (err) {
    console.error("ERRO:", err);
  } finally {
    await client.close();
    console.log("🔚 Conexão encerrada.");
  }
}

run().catch(console.dir);
