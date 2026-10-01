package vn.qts.attendance.application;

import java.security.KeyFactory;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;

import org.springframework.stereotype.Component;

@Component
public class DeviceCrypto {
    private static final byte[] ED25519_SPKI_PREFIX = new byte[] {
            0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00
    };

    public DeviceKeyPair generateKeyPair() {
        try {
            var generator = KeyPairGenerator.getInstance("Ed25519");
            var pair = generator.generateKeyPair();
            byte[] privateKey = ((java.security.interfaces.EdECPrivateKey) pair.getPrivate())
                    .getBytes()
                    .orElseThrow(() -> new IllegalStateException("Ed25519 private key bytes unavailable"));
            byte[] encodedPublic = pair.getPublic().getEncoded();
            byte[] publicKey = Arrays.copyOfRange(encodedPublic, encodedPublic.length - 32, encodedPublic.length);
            return new DeviceKeyPair(privateKey, publicKey);
        } catch (Exception error) {
            throw new IllegalStateException("Cannot generate Ed25519 device key", error);
        }
    }

    public boolean verify(byte[] publicKey, byte[] message, byte[] signature) {
        try {
            byte[] encoded = new byte[ED25519_SPKI_PREFIX.length + publicKey.length];
            System.arraycopy(ED25519_SPKI_PREFIX, 0, encoded, 0, ED25519_SPKI_PREFIX.length);
            System.arraycopy(publicKey, 0, encoded, ED25519_SPKI_PREFIX.length, publicKey.length);
            var key = KeyFactory.getInstance("Ed25519").generatePublic(new X509EncodedKeySpec(encoded));
            var verifier = Signature.getInstance("Ed25519");
            verifier.initVerify(key);
            verifier.update(message);
            return verifier.verify(signature);
        } catch (Exception error) {
            return false;
        }
    }

    public static String b64u(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    public static byte[] decodeB64u(String value) {
        try {
            return Base64.getUrlDecoder().decode(value + "=".repeat((4 - value.length() % 4) % 4));
        } catch (IllegalArgumentException error) {
            throw new IllegalArgumentException("Invalid base64url value", error);
        }
    }
}
