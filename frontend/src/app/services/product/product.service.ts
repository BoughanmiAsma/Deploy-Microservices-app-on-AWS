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
    return this.httpClient.get<Array<Product>>('/api/product');
  }

  createProduct(product: Product): Observable<Product> {
    return this.httpClient.post<Product>('/api/product', product);
  }

  updateProduct(id: string, product: Product): Observable<Product> {
    return this.httpClient.put<Product>(`/api/product/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.httpClient.delete<void>(`/api/product/${id}`);
  }

  reduceStock(id: string, quantity: number = 1): Observable<Product> {
    return this.httpClient.post<Product>(`/api/product/${id}/reduce-stock?quantity=${quantity}`, {});
  }
}
