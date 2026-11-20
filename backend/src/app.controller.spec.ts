import { AppController } from './app.controller.js';

describe('AppController', () => {
  it('reports the api as healthy', () => {
    expect(new AppController().check()).toEqual({ status: 'ok' });
  });
});
