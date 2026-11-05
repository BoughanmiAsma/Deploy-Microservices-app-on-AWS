import {Component, inject, OnInit} from '@angular/core';
import {OidcSecurityService} from "angular-auth-oidc-client";
import {Product} from "../../model/product";
import {ProductService} from "../../services/product/product.service";
import {Router, RouterLink} from "@angular/router";
import {Order} from "../../model/order";
import {FormsModule} from "@angular/forms";
import {OrderService} from "../../services/order/order.service";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-homepage',
  templateUrl: './home-page.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  styleUrl: './home-page.component.css'
})
export class HomePageComponent implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  isAuthenticated = false;
  isSeller = false;
  isBuyer = false;
  username = '';
  products: Array<Product> = [];
  filteredProducts: Array<Product> = [];
  searchQuery: string = '';
  selectedCategory: string = 'Tous';
  
  // E-commerce interactive state
  quantities: { [skuCode: string]: number } = {};
  isOrdering: { [skuCode: string]: boolean } = {};
  isDeleting: { [id: string]: boolean } = {};
  
  // Feedback alerts & toasts
  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';
  orderSuccess = false;
  orderFailed = false;
  errorMessage = '';

  ngOnInit(): void {
    this.oidcSecurityService.isAuthenticated$.subscribe(
      ({isAuthenticated}) => {
        console.log('[HomePage] isAuthenticated:', isAuthenticated);
        this.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
          this.loadProducts();
        }
      }
    );

    this.oidcSecurityService.userData$.subscribe(
      ({userData}) => {
        this.username = userData?.preferred_username ?? '';
        const realmRoles: string[] = userData?.realm_access?.roles || [];
        const clientRoles: string[] = userData?.resource_access?.['angular-client']?.roles || [];
        const allRoles = [...realmRoles, ...clientRoles];

        // User is seller if they have SELLER role, or if username is boughanmiasma (admin/seller)
        this.isSeller = allRoles.includes('SELLER') || this.username === 'boughanmiasma';
        this.isBuyer = allRoles.includes('BUYER') || !this.isSeller || allRoles.length === 0;
      }
    );
  }

  loadProducts(): void {
    this.productService.getProducts()
      .subscribe({
        next: (products) => {
          console.log('[HomePage] Loaded products:', products);
          this.products = products;
          this.filteredProducts = products;
          // Initialize quantities to 1 for each product
          products.forEach(p => {
            if (!this.quantities[p.skuCode]) {
              this.quantities[p.skuCode] = 1;
            }
          });
        },
        error: (err) => {
          console.error('[HomePage] Error loading products:', err);
          this.showToast('Erreur lors du chargement des produits.', 'error');
        }
      });
  }

  setCategory(category: string): void {
    this.selectedCategory = category;
    this.filterProducts();
  }

  filterProducts(): void {
    let result = this.products;

    // Filter by Category
    if (this.selectedCategory !== 'Tous') {
      result = result.filter(p => {
        const text = (p.name + ' ' + p.description + ' ' + p.skuCode).toLowerCase();
        if (this.selectedCategory === 'Smartphones') {
          return text.includes('iphone') || text.includes('phone') || text.includes('galaxy') || text.includes('xiaomi') || text.includes('mobile');
        }
        if (this.selectedCategory === 'PC') {
          return text.includes('mac') || text.includes('laptop') || text.includes('pc') || text.includes('ordinateur') || text.includes('asus') || text.includes('dell');
        }
        if (this.selectedCategory === 'Accessoires') {
          return text.includes('audio') || text.includes('casque') || text.includes('airpod') || text.includes('ecouteur') || text.includes('watch') || text.includes('chargeur') || text.includes('coque') || text.includes('cable');
        }
        return true;
      });
    }

    // Filter by Search Query
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) || 
        p.skuCode.toLowerCase().includes(q)
      );
    }

    this.filteredProducts = result;
  }

  getQuantity(skuCode: string): number {
    return this.quantities[skuCode] || 1;
  }

  incrementQuantity(product: Product): void {
    const current = this.quantities[product.skuCode] || 1;
    const maxStock = product.stock ?? 99;
    if (current < maxStock) {
      this.quantities[product.skuCode] = current + 1;
    } else {
      this.showToast(`Stock maximum disponible atteint (${maxStock} unités)`, 'error');
    }
  }

  decrementQuantity(skuCode: string): void {
    const current = this.quantities[skuCode] || 1;
    this.quantities[skuCode] = Math.max(current - 1, 1);
  }

  getProductImage(product: Product): string {
    if (product.imageUrl && product.imageUrl.trim() !== '') {
      return product.imageUrl;
    }
    const text = (product.name + ' ' + product.description).toLowerCase();
    if (text.includes('iphone') || text.includes('phone') || text.includes('smartphone')) {
      return 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80';
    }
    if (text.includes('mac') || text.includes('laptop') || text.includes('ordinateur') || text.includes('pc')) {
      return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
    }
    if (text.includes('watch') || text.includes('montre')) {
      return 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80';
    }
    if (text.includes('audio') || text.includes('casque') || text.includes('ecouteur') || text.includes('headphone')) {
      return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80';
  }

  getProductBadge(product: Product): string {
    const text = (product.name).toLowerCase();
    if (text.includes('iphone') || text.includes('15') || text.includes('pro')) return 'Nouveau';
    if (product.price > 1000) return 'Premium';
    return 'Populaire';
  }

  login(): void {
    this.oidcSecurityService.authorize();
  }

  goToCreateProductPage() {
    this.router.navigateByUrl('/add-product');
  }

  editProduct(product: Product): void {
    if (product.id) {
      this.router.navigate(['/add-product'], { queryParams: { id: product.id } });
    }
  }

  deleteProduct(product: Product): void {
    if (!product.id) return;
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer l'article "${product.name}" ? Cette action est irréversible.`);
    if (!confirmDelete) return;

    this.isDeleting[product.id] = true;
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        delete this.isDeleting[product.id!];
        this.products = this.products.filter(p => p.id !== product.id);
        this.filterProducts();
        this.showToast(`L'article "${product.name}" a été supprimé avec succès.`, 'success');
      },
      error: (err) => {
        delete this.isDeleting[product.id!];
        console.error('Delete product error:', err);
        this.showToast('Erreur lors de la suppression du produit.', 'error');
      }
    });
  }

  orderProduct(product: Product) {
    const quantity = this.getQuantity(product.skuCode);

    if (quantity <= 0) {
      this.showToast('Veuillez spécifier une quantité valide', 'error');
      return;
    }

    if (product.stock !== undefined && product.stock < quantity) {
      this.showToast(`Stock insuffisant ! Il ne reste que ${product.stock} unité(s).`, 'error');
      return;
    }

    this.isOrdering[product.skuCode] = true;

    this.oidcSecurityService.userData$.subscribe({
      next: (result) => {
        const userDetails = {
          email: result?.userData?.email || 'client@shop.com',
          firstName: result?.userData?.given_name || 'Client',
          lastName: result?.userData?.family_name || 'Boutique'
        };

        const order: Order = {
          skuCode: product.skuCode,
          price: product.price,
          quantity: quantity,
          userDetails: userDetails
        };

        // 1. Trigger order service
        this.orderService.orderProduct(order).subscribe({
          next: () => {
            // 2. Reduce stock on product-service
            if (product.id) {
              this.productService.reduceStock(product.id, quantity).subscribe({
                next: (updatedProd) => {
                  product.stock = updatedProd.stock;
                  this.isOrdering[product.skuCode] = false;
                  this.orderSuccess = true;
                  this.orderFailed = false;
                  this.showToast(`Commande validée pour ${quantity}x ${product.name} ! Stock restant : ${product.stock}`, 'success');
                },
                error: () => {
                  if (product.stock !== undefined) {
                    product.stock = Math.max(0, product.stock - quantity);
                  }
                  this.isOrdering[product.skuCode] = false;
                  this.showToast(`Commande validée pour ${quantity}x ${product.name} ! 🎉`, 'success');
                }
              });
            } else {
              this.isOrdering[product.skuCode] = false;
              this.showToast(`Commande validée pour ${quantity}x ${product.name} ! 🎉`, 'success');
            }
          },
          error: (error) => {
            this.isOrdering[product.skuCode] = false;
            this.orderFailed = true;
            this.orderSuccess = false;
            console.error('Order error:', error);
            this.showToast('Échec de la commande. Veuillez vérifier le service d\'inventaire.', 'error');
          }
        });
      },
      error: () => {
        this.isOrdering[product.skuCode] = false;
        this.showToast('Erreur d\'identification utilisateur.', 'error');
      }
    });
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 4500);
  }
}
