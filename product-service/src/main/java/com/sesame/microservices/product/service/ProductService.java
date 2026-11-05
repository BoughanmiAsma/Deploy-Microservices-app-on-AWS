package com.sesame.microservices.product.service;

import com.sesame.microservices.product.dto.ProductRequest;
import com.sesame.microservices.product.dto.ProductResponse;
import com.sesame.microservices.product.model.Product;
import com.sesame.microservices.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {
    private final ProductRepository productRepository;

    public ProductResponse createProduct(ProductRequest productRequest) {
        Product product = Product.builder()
                .name(productRequest.name())
                .description(productRequest.description())
                .skuCode(productRequest.skuCode())
                .price(productRequest.price())
                .stock(productRequest.stock() != null ? productRequest.stock() : 0)
                .imageUrl(productRequest.imageUrl())
                .build();
        productRepository.save(product);
        log.info("Product created successfully");
        return mapToProductResponse(product);
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::mapToProductResponse)
                .toList();
    }

    public ProductResponse updateProduct(String id, ProductRequest productRequest) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setName(productRequest.name());
        product.setDescription(productRequest.description());
        product.setSkuCode(productRequest.skuCode());
        product.setPrice(productRequest.price());
        if (productRequest.stock() != null) {
            product.setStock(productRequest.stock());
        }
        if (productRequest.imageUrl() != null && !productRequest.imageUrl().isBlank()) {
            product.setImageUrl(productRequest.imageUrl());
        }

        productRepository.save(product);
        log.info("Product updated successfully with id: {}", product.getId());
        return mapToProductResponse(product);
    }

    public void deleteProduct(String id) {
        productRepository.deleteById(id);
        log.info("Product deleted successfully with id: {}", id);
    }

    public ProductResponse reduceStock(String id, int quantity) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        int currentStock = product.getStock() != null ? product.getStock() : 0;
        int newStock = Math.max(0, currentStock - quantity);
        product.setStock(newStock);
        productRepository.save(product);
        log.info("Reduced stock for product {} by {}. New stock: {}", id, quantity, newStock);
        return mapToProductResponse(product);
    }

    private ProductResponse mapToProductResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getSkuCode(),
                product.getPrice(),
                product.getStock() != null ? product.getStock() : 0,
                product.getImageUrl()
        );
    }
}
