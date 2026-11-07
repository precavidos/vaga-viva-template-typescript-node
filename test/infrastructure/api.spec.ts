import { createServer, type Server } from 'node:http';
import { Api } from '../support/api.js';
import { basicAuthorization, PROFESSIONAL, RECEPTIONIST } from '../support/test-users.js';

describe('Cliente HTTP dos testes', () => {
  let server: Server;

  beforeAll(() => {
    server = createServer((request, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ authorization: request.headers.authorization ?? null }));
    });
  });

  it('envia as credenciais da recepcionista por padrão', async () => {
    const response = await new Api(server).get('/');

    expect(response.json('authorization'), 'esperava Basic Auth da recepcionista').toBe(
      basicAuthorization(RECEPTIONIST.username, RECEPTIONIST.password),
    );
  });

  it('não envia credenciais no modo anônimo', async () => {
    const response = await new Api(server).anonymous().get('/');

    expect(response.json('authorization'), 'esperava nenhum cabeçalho Authorization').toBeNull();
  });

  it('envia as credenciais do usuário pedido', async () => {
    const response = await new Api(server).as(PROFESSIONAL).get('/');

    expect(response.json('authorization'), 'esperava Basic Auth do profissional').toBe(
      basicAuthorization(PROFESSIONAL.username, PROFESSIONAL.password),
    );
  });
});
