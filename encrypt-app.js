const crypto = require('crypto');

// 1. Ganti dengan URL Database Anda
const plaintext = "postgres://c07b352ba01fc3200b1844a5897dbed0322471fd4dfdf7c52bd049300a583c1b:sk_G9HTQYfW_BKG-oxmwoSsz@pooled.db.prisma.io:5432/postgres?sslmode=disable";

// 2. Ganti dengan Key rahasia dari pembimbing Anda (harus format Base64)
const keyB64 = "eoL945DRr40vXsjYrIhtP4C1xcxwGacZC1R6RspZN/Y="; 

try {
  // Decode kunci pembimbing menjadi Buffer
  const key = Buffer.from(keyB64, 'base64');
  
  if (key.length !== 32) {
    console.error("❌ Error: Panjang kunci tidak valid. Harus 32 byte untuk AES-256.");
    process.exit(1);
  }

  // Generate 12-byte Nonce acak
  const nonce = crypto.randomBytes(12);
  
  // Buat cipher AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  
  // Enkripsi URL
  let ciphertext = cipher.update(plaintext, 'utf8');
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);
  
  // Dapatkan Auth Tag (16 byte)
  const tag = cipher.getAuthTag();
  
  // VFlow meminta ciphertext digabung dengan tag di bagian akhirnya
  const ciphertextAndTag = Buffer.concat([ciphertext, tag]);

  console.log("✅ ENKRIPSI BERHASIL!\n");
  console.log("Masukkan hasil ini ke dalam file JSON Anda:\n");
  console.log('"nonce_b64": "' + nonce.toString('base64') + '"');
  console.log('"ciphertext_b64": "' + ciphertextAndTag.toString('base64') + '"');
  console.log("\n(File ini murni berjalan di laptop Anda secara lokal tanpa internet.)");

} catch (error) {
  console.error("❌ Terjadi kesalahan:", error.message);
}