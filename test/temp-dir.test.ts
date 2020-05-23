import * as fs from 'fs';

import * as os from 'os';

import bytes from 'bytes';

import {expect} from 'chai';

import {tempDir, tempDirWithFiles} from '../src/index';
import rimraf from 'rimraf';

describe('Folder', () => {
  describe('tempDir', function () {
    let name: string | undefined = undefined;

    const reEnd = process.platform === 'win32' ? /\\test-[\w\d_\-]+$/ : /\/test-[\w\d_\-]+$/;
    const reMatch = process.platform === 'win32' ? /\\test-[\w\d_\-]+-folder$/ : /\/test-[\w\d_\-]+-folder$/;

    // beforeEach(() => {});

    afterEach(async () => {
      if (name !== undefined) {
        await fs.promises.rmdir(name);
        name = undefined;
      }
    });

    it(`calling tempDir() should create an empty directory in ${os.tmpdir()}`, async () => {
      const promise = tempDir();
      expect(promise instanceof Promise).to.be.true;

      name = (await promise) as string;
      const stat = await fs.promises.stat(name);

      expect(name.indexOf(os.tmpdir())).to.equal(0);
      expect(stat.isDirectory()).to.be.true;
    });

    it(`calling tempDir({}, callback) should create an empty directory in ${os.tmpdir()}`, (done) => {
      const promise = tempDir({}, (err: Error | null, dirName?: string) => {
        if (err) throw err;

        expect(dirName).to.be.an('string');

        name = dirName;
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        fs.promises.stat(dirName!).then((stat) => {
          expect(dirName!.indexOf(os.tmpdir())).to.equal(0);
          expect(stat.isDirectory()).to.be.true;

          done();
        });
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
      });

      expect(promise).to.be.undefined;
    });

    it(`calling tempDir({pattern:'test-'}) should create an empty directory in ${os.tmpdir()} with name matching ${reEnd}`, async () => {
      name = (await tempDir({pattern: 'test-'})) as string;

      expect(name).to.match(reEnd);
    });

    it(`calling tempDir({pattern:'test-*-folder'}) should create an empty directory in ${os.tmpdir()} with name matching ${reMatch}`, async () => {
      name = (await tempDir({pattern: 'test-*-folder'})) as string;

      expect(name).to.match(reMatch);
    });

    it(`calling tempDir({dir: __dirname}) should create an empty directory in ${__dirname}`, async () => {
      name = (await tempDir({dir: __dirname})) as string;

      expect(name.indexOf(__dirname)).to.equal(0);
    });

    it(`calling tempDir({default: true}) should throw an error because 'pattern' is not mentioned`, async () => {
      let err: Error | undefined = undefined;
      try {
        await tempDir({default: true});
      } catch (e) {
        err = e;
      }
      expect(err instanceof Error).to.be.true;
      expect((err as Error).toString()).to.equal('Error: invalid `options.pattern` value: please add pattern value');
    });

    it(`calling tempDir({default: true}, callback) should throw an error because 'pattern' is not mentioned`, (done) => {
      const promise = tempDir({default: true}, (err: Error | null) => {
        expect(err instanceof Error).to.be.true;
        expect((err as Error).toString()).to.equal('Error: invalid `options.pattern` value: please add pattern value');

        done();
      });

      expect(promise).to.be.undefined;
    });

    it(`calling tempDir({default: true, pattern: 'test-'}) should create an empty directory in ${os.tmpdir()}`, async () => {
      const promise = tempDir({default: true, pattern: 'test-'});
      expect(promise instanceof Promise).to.be.true;

      name = (await promise) as string;
      const stat = await fs.promises.stat(name);

      expect(name.indexOf(os.tmpdir())).to.equal(0);
      expect(stat.isDirectory()).to.be.true;
    });
  });

  describe('tempDirWithFiles', function () {
    let dwfResult: [string, string[], string[]] | undefined = undefined;

    // beforeEach(() => {});

    afterEach(async () => {
      if (dwfResult !== undefined) {
        await new Promise((resolve) => rimraf(dwfResult![0], {}, resolve));
        dwfResult = undefined;
      }
    });

    it(`calling tempDirWithFiles() should create a directory in ${os.tmpdir()} with 781 folders and 3905 files`, async () => {
      const promise = tempDirWithFiles({
        maxFileSize: '100b',
        pattern: 'tempjs-*',
      });
      expect(promise instanceof Promise).to.be.true;

      dwfResult = (await promise) as [string, string[], string[]];
      expect(dwfResult[0].indexOf(os.tmpdir())).to.equal(0);

      for (const dir of dwfResult[1]) {
        const stat = await fs.promises.stat(dir);
        expect(stat.isDirectory()).to.be.true;
      }

      for (const file of dwfResult[2]) {
        const stat = await fs.promises.stat(file);
        expect(stat.isFile()).to.be.true;
        expect(stat.size).to.equal(bytes('100b'));
      }

      expect(dwfResult[1].length).to.equal(
        1 + Math.pow(5, 1) + Math.pow(5, 2) + Math.pow(5, 3) + Math.pow(5, 4), // + Math.pow(5, 5), // i start from depth 1
      );

      expect(dwfResult[2].length).to.equal(
        Math.pow(5, 1) + Math.pow(5, 2) + Math.pow(5, 3) + Math.pow(5, 4) + Math.pow(5, 5),
      );
    });

    it(`calling tempDirWithFiles({}, callback) should create an empty directory in ${os.tmpdir()} with 781 folders and 3905 files`, (done) => {
      const promise = tempDirWithFiles(
        {
          maxFileSize: '100b',
          pattern: 'tempjs-*',
        },
        (err: Error | null, result?: [string, string[], string[]]) => {
          if (err) throw err;

          expect(result).to.be.an('array');

          dwfResult = result;
          /* eslint-disable @typescript-eslint/no-non-null-assertion */
          expect(dwfResult![0].indexOf(os.tmpdir())).to.equal(0);

          expect(dwfResult![1].length).to.equal(
            1 + Math.pow(5, 1) + Math.pow(5, 2) + Math.pow(5, 3) + Math.pow(5, 4), // + Math.pow(5, 5), // i start from depth 1
          );

          expect(dwfResult![2].length).to.equal(
            Math.pow(5, 1) + Math.pow(5, 2) + Math.pow(5, 3) + Math.pow(5, 4) + Math.pow(5, 5),
          );
          /* eslint-enable @typescript-eslint/no-non-null-assertion */

          done();
        },
      );

      expect(promise).to.be.undefined;
    });

    it(`calling tempDirWithFiles({randomize: true}) should create a directory in ${os.tmpdir()} with less than 781 folders and less than 3905 files`, async () => {
      const promise = tempDirWithFiles({
        maxFileSize: '100b',
        pattern: 'tempjs-*',
        randomize: true,
      });
      expect(promise instanceof Promise).to.be.true;

      dwfResult = (await promise) as [string, string[], string[]];
      expect(dwfResult[0].indexOf(os.tmpdir())).to.equal(0);

      for (const dir of dwfResult[1]) {
        const stat = await fs.promises.stat(dir);
        expect(stat.isDirectory()).to.be.true;
      }

      for (const file of dwfResult[2]) {
        const stat = await fs.promises.stat(file);
        expect(stat.isFile()).to.be.true;
        expect(stat.size).to.lessThan(bytes('100b'));
      }

      expect(dwfResult[1].length).to.be.lessThan(
        1 +
          Math.pow(5, 1) +
          Math.pow(5, 2) +
          Math.pow(5, 3) +
          Math.pow(5, 4) /* + Math.pow(5, 5), /* i start from depth 1 */,
      );

      expect(dwfResult[2].length).to.be.lessThan(
        Math.pow(5, 1) + Math.pow(5, 2) + Math.pow(5, 3) + Math.pow(5, 4) + Math.pow(5, 5),
      );
    });
  });
});
