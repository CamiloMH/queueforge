import { isValidCronExpression } from './cron.util';

describe('isValidCronExpression', () => {
  it.each(['*/5 * * * *', '0 9 * * 1-5', '0 0 1 * *', '30 2 * * 0'])(
    'acepta la expresión válida "%s"',
    (expression) => {
      expect(isValidCronExpression(expression)).toBe(true);
    },
  );

  it.each(['', 'cada minuto', '* * *', '* * * * * * *', '60 ? ? ? ?@'])(
    'rechaza la expresión inválida "%s"',
    (expression) => {
      expect(isValidCronExpression(expression)).toBe(false);
    },
  );
});
