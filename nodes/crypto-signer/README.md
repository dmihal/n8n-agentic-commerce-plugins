# Crypto Signer Nodes

This n8n package provides two specialized nodes for cryptographic signature operations:

1. **EIP-712 Signer**: General-purpose EIP-712 typed structured data signing
2. **ERC-3009 Signer**: Specialized ERC-3009 `transferWithAuthorization` signing

Both nodes share the same EVM private key credential system and provide comprehensive signature creation and verification capabilities.

## Features

### EIP-712 Signer
- **Sign EIP-712 Messages**: Create cryptographic signatures for typed structured data
- **Verify Signatures**: Verify EIP-712 signatures and recover signer addresses
- **Flexible Domain Configuration**: Support for custom domain parameters
- **Custom Type Definitions**: JSON-based type definitions for any EIP-712 structure

### ERC-3009 Signer
- **Sign Transfer Authorization**: Create ERC-3009 `transferWithAuthorization` signatures
- **Verify Transfer Authorization**: Verify ERC-3009 signatures and recover signer addresses
- **Meta-Transaction Support**: Enable gasless token transfers
- **Time-Based Authorization**: Set validity windows for transfers
- **Nonce-Based Security**: Prevent replay attacks with unique nonces

### Shared Features
- **Multiple Network Support**: Works with various EVM networks
- **Secure Private Key Handling**: Uses the same credential system
- **Comprehensive Validation**: Input validation and error handling

## Credentials

### EVM Private Key

The node requires an EVM private key credential with the following properties:

- **Private Key**: The EVM private key for signing (stored securely)
- **Network**: The EVM network (Mainnet, Sepolia, Goerli, Polygon, Arbitrum, Optimism, or Custom)
- **Custom Chain ID**: For custom networks, specify the chain ID

## Operations

### EIP-712 Signer Operations

#### Sign Message

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

#### Verify Signature

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

### ERC-3009 Signer Operations

#### Sign Transfer Authorization

Signs an ERC-3009 `transferWithAuthorization` message.

**Parameters:**
- **Token Contract Address**: The address of the ERC-3009 token contract
- **From Address**: The address of the token sender
- **To Address**: The address of the token recipient
- **Value**: The amount of tokens to transfer (in wei)
- **Valid After**: Unix timestamp after which the authorization is valid
- **Valid Before**: Unix timestamp before which the authorization is valid
- **Nonce**: A unique 32-byte nonce for the authorization

**Output:**
- **signature**: The generated signature
- **signerAddress**: The address of the signer
- **domain**: The ERC-3009 domain used for signing
- **types**: The ERC-3009 types definition
- **message**: The transfer authorization message
- **operation**: Always "transferWithAuthorization"
- **tokenContract**: The token contract address
- **fromAddress**: The sender address
- **toAddress**: The recipient address
- **value**: The transfer amount
- **validAfter**: The validity start time
- **validBefore**: The validity end time
- **nonce**: The authorization nonce

#### Verify Transfer Authorization

Verifies an ERC-3009 signature and recovers the signer address.

**Parameters:**
- All parameters from Sign Transfer Authorization operation
- **Signature to Verify**: The signature to verify
- **Expected Signer Address**: The expected signer address

**Output:**
- **isValid**: Whether the signature is valid
- **recoveredAddress**: The recovered signer address
- **expectedSignerAddress**: The expected signer address
- **signature**: The verified signature
- **domain**: The ERC-3009 domain used for verification
- **types**: The ERC-3009 types definition
- **message**: The transfer authorization message
- **operation**: Always "transferWithAuthorization"
- Plus all the transfer parameters

## Example Usage

### Signing a Message

#### EIP-712 Signing

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

#### ERC-3009 Signing

```json
{
  "tokenContract": "0xA0b86a33E6441b8c4C8C0E4A0b86a33E6441b8c4C",
  "fromAddress": "0x1234567890123456789012345678901234567890",
  "toAddress": "0x0987654321098765432109876543210987654321",
  "value": "1000000000000000000",
  "validAfter": 1640995200,
  "validBefore": 1641081600,
  "nonce": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

### Verifying a Signature

#### EIP-712 Verification

Use the same parameters as signing, plus:
- **signatureToVerify**: The signature to verify
- **signerAddress**: The expected signer address

#### ERC-3009 Verification

Use the same parameters as signing, plus:
- **signatureToVerify**: The signature to verify
- **expectedSignerAddress**: The expected signer address

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
