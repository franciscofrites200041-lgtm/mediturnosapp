import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionService {
    private readonly encryptionKey: string;

    constructor(private configService: ConfigService) {
        this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'default-key-change-me';
    }

    /**
     * Encrypts sensitive data (e.g., medical records, document numbers)
     */
    encrypt(data: string): string {
        if (!data) return data;
        return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
    }

    /**
     * Decrypts encrypted data
     */
    decrypt(encryptedData: string): string {
        if (!encryptedData) return encryptedData;
        const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    /**
     * Encrypts an object's specified fields
     */
    encryptFields<T extends Record<string, any>>(data: T, fields: string[]): T {
        const encrypted: Record<string, any> = { ...data };
        for (const field of fields) {
            if (encrypted[field] && typeof encrypted[field] === 'string') {
                encrypted[field] = this.encrypt(encrypted[field]);
            }
        }
        return encrypted as T;
    }

    /**
     * Decrypts an object's specified fields
     */
    decryptFields<T extends Record<string, any>>(data: T, fields: string[]): T {
        const decrypted: Record<string, any> = { ...data };
        for (const field of fields) {
            if (decrypted[field] && typeof decrypted[field] === 'string') {
                decrypted[field] = this.decrypt(decrypted[field]);
            }
        }
        return decrypted as T;
    }

    /**
     * Hash data (one-way, for comparisons)
     */
    hash(data: string): string {
        return CryptoJS.SHA256(data).toString();
    }
}

