# Signing key

`duha.p12.enc` is the app's signing key (PKCS12, alias `duha`), encrypted with AES-256 (PBKDF2, 600000 rounds).
The passphrase is NOT in this repository; Hadi has it. The keystore password and key password are the same passphrase.

Decrypt:

    openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in duha.p12.enc -out duha.p12 -pass pass:PASSPHRASE

Certificate SHA-256: A5:4F:41:00:FF:A8:B9:D3:C7:8C:C5:70:D9:2C:21:FD:8E:C3:44:8D:DE:F1:91:95:67:79:8C:20:7E:44:C2:00
(first used for version 5.0; versions up to 4.5.1 were signed with an older key that was lost.)
Every future version must be signed with this key, or it will not install over the app on the phone.
