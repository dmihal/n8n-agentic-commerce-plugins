# EIP-712 Signer Node

This n8n node provides functionality to sign and verify EIP-712 typed structured data messages using EVM private keys.

## Features

- **Sign EIP-712 Messages**: Create cryptographic signatures for typed structured data
- **Verify Signatures**: Verify EIP-712 signatures and recover signer addresses
- **Flexible Domain Configuration**: Support for custom domain parameters
- **Multiple Network Support**: Works with various EVM networks

## Credentials

### EVM Private Key

The node requires an EVM private key credential with the following properties:

- **Private Key**: The EVM private key for signing (stored securely)
- **Network**: The EVM network (Mainnet, Sepolia, Goerli, Polygon, Arbitrum, Optimism, or Custom)
- **Custom Chain ID**: For custom networks, specify the chain ID

## Operations

### Sign Message

Signs an EIP-712 typed structured data message.

**Parameters:**
- **Domain Name**: The name of the domain (e.g., "MyDApp")
- **Domain Version**: The version of the domain
- **Chain ID**: The chain ID for the domain
- **Verifying Contract**: The address of the verifying contract (optional)
- **Salt**: The salt for the domain (optional)
- **Types Definition**: JSON definition of the types for EIP-712 signing
- **Primary Type**: The primary type of the message to sign
- **Message Data**: The message data to sign

**Output:**
- **signature**: The generated signature
- **signerAddress**: The address of the signer
- **domain**: The domain used for signing
- **types**: The types definition
- **message**: The message data
- **primaryType**: The primary type

### Verify Signature

Verifies an EIP-712 signature and recovers the signer address.

**Parameters:**
- All parameters from Sign Message operation
- **Signature to Verify**: The signature to verify
- **Signer Address**: The expected signer address

**Output:**
- **isValid**: Whether the signature is valid
- **recoveredAddress**: The recovered signer address
- **expectedSignerAddress**: The expected signer address
- **signature**: The verified signature
- **domain**: The domain used for verification
- **types**: The types definition
- **message**: The message data
- **primaryType**: The primary type

## Example Usage

### Signing a Message

```json
{
  "domainName": "MyDApp",
  "domainVersion": "1",
  "chainId": 1,
  "typesDefinition": {
    "EIP712Domain": [
      {"name": "name", "type": "string"},
      {"name": "version", "type": "string"},
      {"name": "chainId", "type": "uint256"},
      {"name": "verifyingContract", "type": "address"}
    ],
    "Person": [
      {"name": "name", "type": "string"},
      {"name": "wallet", "type": "address"}
    ]
  },
  "primaryType": "Person",
  "messageData": {
    "name": "Alice",
    "wallet": "0x1234567890123456789012345678901234567890"
  }
}
```

### Verifying a Signature

Use the same parameters as signing, plus:
- **signatureToVerify**: The signature to verify
- **signerAddress**: The expected signer address

## Security Considerations

- **Private Key Storage**: Private keys are stored securely in n8n's credential system
- **Network Validation**: Always verify you're using the correct network and chain ID
- **Message Validation**: Ensure the message data matches your expected structure
- **Signature Verification**: Always verify signatures before trusting them

## Troubleshooting

### Common Errors

**"Expected valid bigint: 0 < bigint < curve.n"**
This error occurs when the private key is invalid. Common causes:
- Private key is not a valid 64-character hex string
- Private key is missing the 0x prefix (the node will add it automatically)
- Private key contains invalid characters or whitespace
- Private key is out of the valid range for the elliptic curve

**Solution**: Ensure your private key is a valid 64-character hex string. Examples:
- ✅ Valid: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
- ✅ Valid: `1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef` (0x will be added)
- ❌ Invalid: `1234567890abcdef` (too short)
- ❌ Invalid: `0x1234567890abcdef` (too short)
- ❌ Invalid: `not-a-hex-string`

**"Invalid private key format"**
The private key must be exactly 64 hexadecimal characters (with or without 0x prefix).

**"Signature verification failed"**
This occurs during verification when:
- The signature is malformed
- The message data doesn't match what was originally signed
- The domain parameters are different
- The types definition is different

## Dependencies

- **ethers**: Ethereum library for cryptographic operations
- **n8n-workflow**: n8n workflow engine

## Installation

1. Install the node package
2. Configure your EVM private key credentials
3. Use the node in your n8n workflows

## License

MIT
