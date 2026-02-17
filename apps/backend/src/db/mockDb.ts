interface ApiKeyRecord {
    accountId: string;
    apiKeyPrefix: string;
    apiKeyHash: string;
    revoked: boolean;
  }
  
  const apiKeys: ApiKeyRecord[] = [];
  
  export function saveApiKey(record: ApiKeyRecord) {
    apiKeys.push(record);
  }
  
  export function findByPrefix(prefix: string): ApiKeyRecord | undefined {
    return apiKeys.find(
      (k) => k.apiKeyPrefix === prefix && !k.revoked
    );
  }
  