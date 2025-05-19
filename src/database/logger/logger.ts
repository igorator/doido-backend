import { Logger, QueryRunner } from 'typeorm';
import chalk from 'chalk';

export class MinimalLogger implements Logger {
  logQuery(query: string, _parameters?: any[], _queryRunner?: QueryRunner) {
    const command = query.split(' ')[0].toUpperCase();
    const shortQuery = query.replace(/\s+/g, ' ').slice(0, 100) + '...';
    console.log(
      `${chalk.blueBright('🔹')} ${chalk.cyan(command)} ${chalk.dim(
        shortQuery,
      )}`,
    );
  }

  logQueryError(error: string, query: string) {
    const command = query.split(' ')[0].toUpperCase();
    console.log(
      `${chalk.red('❌')} ${chalk.redBright(command)} ${chalk.dim(
        query.slice(0, 100),
      )}`,
    );
    console.log(`${chalk.red('↪')} ${error}`);
  }

  logQuerySlow(time: number, query: string) {
    const command = query.split(' ')[0].toUpperCase();
    console.warn(`${chalk.yellow('🐢')} Slow ${command} - ${time}ms`);
    console.log(`${chalk.yellow('↪')} ${chalk.dim(query.slice(0, 100))}`);
  }

  logSchemaBuild(message: string) {
    console.log(`${chalk.magenta('📐')} ${chalk.magentaBright(message)}`);
  }

  logMigration(message: string) {
    console.log(`${chalk.green('📦')} ${chalk.greenBright(message)}`);
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    const prefix = {
      log: chalk.white('📘'),
      info: chalk.blue('ℹ️'),
      warn: chalk.yellow('⚠️'),
    }[level];

    console.log(`${prefix} ${chalk.gray(message)}`);
  }
}
