/**
 * Usuários de teste. Os mesmos dados estão em `test/config/security-users.json`, o arquivo indicado pela variável
 * `CLINIC_SECURITY_USERS_FILE` durante os testes.
 */
export interface TestUser {
  username: string;
  password: string;
}

export const RECEPTIONIST: TestUser = { username: 'recepcao', password: 'recepcao-senha' };

export const PROFESSIONAL: TestUser = { username: 'dra.helena', password: 'profissional-senha' };

export function basicAuthorization(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`;
}
