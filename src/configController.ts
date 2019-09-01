import { Request, Response } from 'express';
import { ServerList } from './itemsController';

export let config: ServerList = {
  servers: [
    {
      name: "alpha",
      errorFrequency: 0
    },
  ]
}

export class ConfigController {

  static getConfig(_req: Request, res: Response) {
    res.status(200).send(config)
  }

  static updateConfig(req: Request, res: Response) {
    if (ConfigController.checkForBadConfig(req.body)) {
      res.status(400).send('Invalid config');
      return
    }
    config = req.body as ServerList;
    res.status(200).send(req.body);
  }

  static checkForBadConfig(config: any): boolean {
    if (Object.keys(config).length < 1) {
      return true; // true stands for bad
    }
    if (config.servers.length <= 0) {
      return true
    }
    if (
      typeof config.servers[0].name !== 'string' ||
      typeof config.servers[0].errorFrequency !== 'number') {
      return true
    }
    if (
      config.servers[0].name === null ||
      config.servers[0].name === '') {
      return true;
    }
    if (
      parseInt(config.servers[0].errorFrequency) < 0 ||
      parseInt(config.servers[0].errorFrequency) > 10) {
      return true;
    }
    return false;
  }
}
