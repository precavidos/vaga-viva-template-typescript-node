import request from 'supertest';
import { basicAuthorization, RECEPTIONIST, type TestUser } from './test-users.js';

type Server = Parameters<typeof request>[0];

export class ApiResponse {
  readonly body: unknown;

  constructor(
    readonly request: string,
    readonly status: number,
    private readonly headers: Record<string, unknown>,
    readonly text: string,
  ) {
    this.body = parseJson(text);
  }

  header(name: string): string | undefined {
    const value = this.headers[name.toLowerCase()];
    if (value === undefined) {
      return undefined;
    }
    return Array.isArray(value) ? value.join(', ') : String(value);
  }

  get contentType(): string {
    return this.header('content-type') ?? '';
  }

  /**
   * Lê um valor do corpo JSON, por um caminho como `id`, `page.totalElements` ou `content[0].start`. Devolve
   * `undefined` quando o caminho não existe ou o corpo não é JSON, para o teste falhar na asserção seguinte.
   */
  json(path: string): unknown {
    let value: unknown = this.body;
    for (const key of path.split(/\.|\[(\d+)\]/).filter((part) => part !== undefined && part !== '')) {
      if (value === null || typeof value !== 'object') {
        return undefined;
      }
      value = (value as Record<string, unknown>)[key];
    }
    return value;
  }

  describe(): string {
    return `${this.request} respondeu ${this.status} com corpo: ${this.text}`;
  }
}

/**
 * Cliente HTTP dos testes. Por padrão, toda chamada envia as credenciais da recepcionista.
 */
export class Api {
  constructor(
    private readonly server: Server,
    private readonly authorization: string | undefined = basicAuthorization(RECEPTIONIST.username, RECEPTIONIST.password),
  ) {}

  as(user: TestUser): Api {
    return new Api(this.server, basicAuthorization(user.username, user.password));
  }

  withCredentials(username: string, password: string): Api {
    return new Api(this.server, basicAuthorization(username, password));
  }

  anonymous(): Api {
    return new Api(this.server, undefined);
  }

  get(path: string): Promise<ApiResponse> {
    return this.perform('GET', path);
  }

  post(path: string, body?: object | string): Promise<ApiResponse> {
    return this.perform('POST', path, body);
  }

  put(path: string, body?: object | string): Promise<ApiResponse> {
    return this.perform('PUT', path, body);
  }

  delete(path: string): Promise<ApiResponse> {
    return this.perform('DELETE', path);
  }

  private async perform(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: object | string): Promise<ApiResponse> {
    const agent = request(this.server);
    let call =
      method === 'GET' ? agent.get(path) : method === 'POST' ? agent.post(path) : method === 'PUT' ? agent.put(path) : agent.delete(path);
    call = call.set('Accept', 'application/json, application/problem+json').buffer(true);
    if (this.authorization !== undefined) {
      call = call.set('Authorization', this.authorization);
    }
    if (body !== undefined) {
      call = call.set('Content-Type', 'application/json').send(typeof body === 'string' ? body : JSON.stringify(body));
    }
    const response = await call;
    return new ApiResponse(`${method} ${path}`, response.status, response.headers, response.text ?? '');
  }
}

/** Confere o status HTTP, com a resposta completa na mensagem de falha. */
export function expectStatus(response: ApiResponse, status: number, message: string): void {
  expect(response.status, `${message}; ${response.describe()}`).toBe(status);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
