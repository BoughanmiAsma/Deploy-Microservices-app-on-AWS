import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Product} from "../../model/product";
import {ProductService} from "../../services/product/product.service";
import {CommonModule} from "@angular/common";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent implements OnInit {
  addProductForm: FormGroup;
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isEditMode = false;
  editingProductId: string | null = null;
  productCreated = false;
  productUpdated = false;
  isSubmitting = false;
  errorMessage: string | null = null;
  imageFileName: string | null = null;

  constructor(private fb: FormBuilder) {
    this.addProductForm = this.fb.group({
      skuCode: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [null, [Validators.required, Validators.min(0.01)]],
      stock: [10, [Validators.required, Validators.min(0)]],
      imageUrl: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.editingProductId = params['id'];
        this.loadProductToEdit(params['id']);
      }
    });
  }

  loadProductToEdit(id: string): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        const found = products.find(p => p.id === id);
        if (found) {
          this.addProductForm.patchValue({
            skuCode: found.skuCode,
            name: found.name,
            description: found.description,
            price: found.price,
            stock: found.stock ?? 0,
            imageUrl: found.imageUrl ?? ''
          });
        }
      },
      error: (err) => console.error('Error fetching product to edit', err)
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.imageFileName = file.name;

      // Validate file size (< 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = "L'image sélectionnée dépasse la taille maximale autorisée (5 Mo).";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        this.addProductForm.patchValue({
          imageUrl: base64String
        });
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.addProductForm.patchValue({ imageUrl: '' });
    this.imageFileName = null;
  }

  onSubmit(): void {
    if (this.addProductForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = null;

      const productPayload: Product = {
        id: this.editingProductId || undefined,
        skuCode: this.addProductForm.get('skuCode')?.value?.trim().toUpperCase(),
        name: this.addProductForm.get('name')?.value?.trim(),
        description: this.addProductForm.get('description')?.value?.trim(),
        price: Number(this.addProductForm.get('price')?.value),
        stock: Number(this.addProductForm.get('stock')?.value ?? 0),
        imageUrl: this.addProductForm.get('imageUrl')?.value || undefined
      };

      if (this.isEditMode && this.editingProductId) {
        this.productService.updateProduct(this.editingProductId, productPayload).subscribe({
          next: () => {
            this.isSubmitting = false;
            this.productUpdated = true;
            setTimeout(() => this.router.navigate(['/']), 1500);
          },
          error: (err) => {
            this.isSubmitting = false;
            console.error('Failed to update product:', err);
            this.errorMessage = 'Impossible de mettre à jour le produit.';
          }
        });
      } else {
        this.productService.createProduct(productPayload).subscribe({
          next: () => {
            this.isSubmitting = false;
            this.productCreated = true;
            this.addProductForm.reset({ stock: 10 });
            this.imageFileName = null;
          },
          error: (err) => {
            this.isSubmitting = false;
            console.error('Failed to create product:', err);
            this.errorMessage = 'Impossible de créer le produit. Vérifiez que la Gateway et le service produit sont en ligne.';
          }
        });
      }
    }
  }

  getPreviewImage(): string {
    const customImg = this.addProductForm.get('imageUrl')?.value;
    if (customImg && customImg.trim() !== '') {
      return customImg;
    }
    const name = (this.addProductForm.get('name')?.value || '').toLowerCase();
    if (name.includes('iphone') || name.includes('phone') || name.includes('smartphone')) {
      return 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80';
    }
    if (name.includes('mac') || name.includes('laptop') || name.includes('pc')) {
      return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
    }
    if (name.includes('audio') || name.includes('casque') || name.includes('ecouteur')) {
      return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80';
  }

  get skuCode() { return this.addProductForm.get('skuCode'); }
  get name() { return this.addProductForm.get('name'); }
  get description() { return this.addProductForm.get('description'); }
  get price() { return this.addProductForm.get('price'); }
  get stock() { return this.addProductForm.get('stock'); }
  get imageUrl() { return this.addProductForm.get('imageUrl'); }
}
