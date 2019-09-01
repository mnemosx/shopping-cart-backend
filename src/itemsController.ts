import csv from 'csvtojson';
import { Request, Response } from 'express';
import { Item } from './item';
import { resolve } from 'path';
import { config } from "./configController";
const csvFilePath = resolve(__dirname, '../store.csv');

const toItem = (line: any) => {
  return {
    id: line.id.toString(),
    title: line.title,
    description: line.description,
    image: line.image,
    expectedDeliveryDate: line.expected_delivery_date,
    seller: line.seller,
    sellerImage: line.seller_image,
  } as Item
}

interface CalculatePriceBody {
  quantity: number
}
interface Server {
  name: string,
  errorFrequency: number
}
export interface ServerList {
  servers: Server[]
}

export let counter = 1;

function serverStatus(config: ServerList, req: string): number {
  if (req === config.servers[0].name) {
    if (counter <= config.servers[0].errorFrequency) {
      counter === 10 ? counter = 1 : counter++;
      return 500;
    } else {
      counter === 10 ? counter = 1 : counter++;
      return 200;
    }
  } else {
    return 500;
  }
}

export class ItemsController {
  static getAll(req: Request, res: Response) {
    const page = parseInt(req.query.page) || 0
    const size = parseInt(req.query.size) || 25

    const requestedServer = (req.params as any).server;

    if (serverStatus(config, requestedServer) === 500) {
      res.status(500).send("Server error");
    } else {

      csv()
        .fromFile(csvFilePath)
        .then((items) => {
          res.send({
            page: page,
            totalPages: Math.ceil(items.length / size),
            totalItems: items.length,
            items: items
              .map(toItem)
              .slice(page * size, page * size + size)
          })
        })
    }
  }

  static getSingleItem(req: Request, res: Response) {
    const id: string = (req.params as any).id;

    csv()
      .fromFile(csvFilePath)
      .then((lines: any[]) => {
        const line = lines.find(line => line.id.toString() === id)
        if (line !== undefined) {
          res.json(toItem(line));
        } else {
          res.status(404).send('Could not find the id you requested');
        }
      }, (e: Error) => {
        res.status(500).send(`Sorry - was unable to open csv database: ${e.message}`);
      });
  }

  static getItemQuantity(req: Request, res: Response) {
    const id: string = (req.params as any).id;
    csv()
      .fromFile(csvFilePath)
      .then(lines => {
        const line = lines.find(line => line.id.toString() === id)
        if (line !== undefined) {
          res.json(
            parseInt(line.quantity)
          );
        } else {
          res.status(404).send('Could not find the quantity of item you requested');
        }
      }, (e: Error) => {
        res.status(500).send(`Sorry - was unable to open csv database: ${e.message}`);
      });
  }

  static calculatePrice(req: Request, res: Response) {
    const id: string = (req.params as any).id;
    const body = req.body as CalculatePriceBody
    if (!body.quantity) {
      res.status(400).send('No quantity specified for item you requested');
      return
    }

    function calcSum(price: number, quantity: number): number {
      return price * quantity
    }

    csv()
      .fromFile(csvFilePath)
      .then(
        lines => {
          const line = lines.find(line => line.id.toString() === id)
          if (line !== undefined) {
            if (body.quantity <= line.quantity) {
              const price = parseFloat(line.price)
              if (line.sale === '') {
                res.send(`${calcSum(price, body.quantity)} EUR`);
              } else {
                // Discounted items are identified by string "5 for 4". 
                // Regex takes both numbers from string which are then put in array.
                const sale = line.sale.match(/(\d[\d\.]*)/g)
                const quantityOfFreeItems = Math.floor(body.quantity / sale[0])
                res.send(`${calcSum(price, body.quantity) - calcSum(price, quantityOfFreeItems)} EUR`);
              }
            } else {
              res.status(400).send('Wrong quantity specified');
            }
          } else {
            res.status(404).send('Could not find the price of item you requested');
          }
        }, (e: Error) => {
          res.status(500).send(`Sorry - was unable to open csv database: ${e.message}`);
        });
  }
}