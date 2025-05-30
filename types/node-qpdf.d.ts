/**
 * Type definitions for node-qpdf 1.0.3
 *
 * This module provides an interface to the QPDF library
 * for working with PDF documents, including encryption and security.
 */

declare module "node-qpdf" {
  export interface QpdfEncryptOptions {
    /**
     * Length of encryption key in bits (40, 128, or 256)
     */
    keyLength: 40 | 128 | 256;

    /**
     * Path to the input PDF file
     */
    inputFile: string;

    /**
     * Path where the encrypted output PDF will be saved
     */
    outputFile: string;

    /**
     * User password for opening the PDF
     */
    password: string;

    /**
     * Owner password for removing restrictions
     */
    ownerPassword: string;

    /**
     * Allow printing of the document
     */
    allowPrinting?: boolean;

    /**
     * Allow modification of the document
     */
    allowModify?: boolean;

    /**
     * Allow extraction of text and graphics
     */
    allowCopy?: boolean;

    /**
     * Allow adding or modifying annotations
     */
    allowAnnotations?: boolean;

    /**
     * Allow filling of form fields
     */
    allowFillForms?: boolean;

    /**
     * Allow extraction of text and graphics for accessibility purposes
     */
    allowAccessibility?: boolean;

    /**
     * Allow document assembly
     */
    allowAssembly?: boolean;

    /**
     * Allow high-resolution printing
     */
    allowPrintHighRes?: boolean;
  }

  export interface QpdfDecryptOptions {
    /**
     * Path to the input encrypted PDF file
     */
    inputFile: string;

    /**
     * Path where the decrypted output PDF will be saved
     */
    outputFile: string;

    /**
     * Password to decrypt the PDF
     */
    password?: string;
  }

  export class Qpdf {
    /**
     * Encrypts a PDF document with specified security settings
     * @param options Encryption options
     * @returns Promise resolving when encryption is complete
     */
    encrypt(options: QpdfEncryptOptions): Promise<void>;

    /**
     * Decrypts an encrypted PDF document
     * @param options Decryption options
     * @returns Promise resolving when decryption is complete
     */
    decrypt(options: QpdfDecryptOptions): Promise<void>;
  }
}
