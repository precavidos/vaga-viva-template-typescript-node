import { DateTime } from 'luxon';
import { appointmentDuration } from '../../src/appointments/appointment-duration.js';
import { describeMission } from '../support/missions.js';

function local(value: string): DateTime {
  return DateTime.fromISO(value, { zone: 'America/Sao_Paulo' });
}

describeMission('bug-hunt', 'caça ao bug na duração das consultas', () => {
  it('calcula a duração de uma consulta que termina no dia seguinte', () => {
    const minutes = appointmentDuration(local('2030-03-04T23:30'), local('2030-03-05T00:30'));

    expect(minutes, 'esperava 60 minutos entre 23:30 e 00:30 do dia seguinte').toBe(60);
  });

  it('calcula a duração de um plantão noturno de várias horas', () => {
    const minutes = appointmentDuration(local('2030-03-04T22:00'), local('2030-03-05T02:15'));

    expect(minutes, 'esperava 255 minutos entre 22:00 e 02:15 do dia seguinte').toBe(255);
  });

  it('calcula a duração de um período de exatamente 24 horas', () => {
    const minutes = appointmentDuration(local('2030-03-04T10:00'), local('2030-03-05T10:00'));

    expect(minutes, 'esperava 1440 minutos em 24 horas').toBe(1440);
  });

  it('calcula a duração na virada do ano', () => {
    const minutes = appointmentDuration(local('2030-12-31T23:45'), local('2031-01-01T00:15'));

    expect(minutes, 'esperava 30 minutos entre 23:45 de 31/12 e 00:15 de 01/01').toBe(30);
  });
});
