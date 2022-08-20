import { Injectable } from '@nestjs/common';

import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {

  constructor(
    private readonly productsService: ProductsService
  ) {}

  async runSeed() {
    const resp = await this.insertNewProducts();

    if(resp)
      return 'SEED EXECUTED';
    else
      return 'ERROR';
  }

  private async insertNewProducts() {
    await this.productsService.deleteAllProducts();

    const products = initialData.products;

    const insertPromises = [];

    products.forEach( product => {
      insertPromises.push( this.productsService.create(product) );
    });

    await Promise.all( insertPromises );

    return true;
  }
}
