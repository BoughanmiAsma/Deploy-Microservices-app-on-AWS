import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Product} from "../../model/product";

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private httpClient: HttpClient) {
  }

  getProducts(): Observable<Array<Product>> {
    return this.httpClient.get<Array<Product>>('http://localhost:9000/api/product');
  }

  createProduct(product: Product): Observable<Product> {
    return this.httpClient.post<Product>('http://localhost:9000/api/product', product);
  }

  updateProduct(id: string, product: Product): Observable<Product> {
    return this.httpClient.put<Product>(`http://localhost:9000/api/product/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.httpClient.delete<void>(`http://localhost:9000/api/product/${id}`);
  }

  reduceStock(id: string, quantity: number = 1): Observable<Product> {
    return this.httpClient.post<Product>(`http://localhost:9000/api/product/${id}/reduce-stock?quantity=${quantity}`, {});
  }
}
