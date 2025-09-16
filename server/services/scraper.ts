import { ProductSearchQuery } from "./openai";
import type { InsertProduct } from "@shared/schema";

// Mock scraper implementation - in production, this would use actual scraping services
export class ProductScraper {
  private mockProducts: Omit<InsertProduct, "searchId">[] = [
    {
      title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
      description: "Industry-leading noise canceling with Dual Noise Sensor technology",
      price: "349.99",
      originalPrice: "399.99",
      imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      rating: "4.8",
      reviewCount: 1247,
      brand: "Sony",
      category: "Electronics",
      source: "Amazon",
      sourceUrl: "https://amazon.com/sony-wh1000xm5",
      inStock: true,
    },
    {
      title: "Apple AirPods Pro (2nd Generation)",
      description: "Active Noise Cancellation with Adaptive Transparency",
      price: "249.99",
      imageUrl: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      rating: "4.6",
      reviewCount: 892,
      brand: "Apple",
      category: "Electronics",
      source: "Apple Store",
      sourceUrl: "https://apple.com/airpods-pro",
      inStock: true,
    },
    {
      title: "SteelSeries Arctis 7P Wireless Gaming Headset",
      description: "Lossless 2.4GHz wireless with 24+ hour battery life",
      price: "159.99",
      originalPrice: "179.99",
      imageUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      rating: "4.3",
      reviewCount: 567,
      brand: "SteelSeries",
      category: "Gaming",
      source: "Newegg",
      sourceUrl: "https://newegg.com/steelseries-arctis7p",
      inStock: true,
    },
    {
      title: "Anker Soundcore Life Q20 Hybrid Active Noise Cancelling",
      description: "Hi-Res Audio with 60-Hour Playtime",
      price: "59.99",
      originalPrice: "79.99",
      imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      rating: "4.1",
      reviewCount: 2134,
      brand: "Anker",
      category: "Electronics",
      source: "Amazon",
      sourceUrl: "https://amazon.com/anker-soundcore-q20",
      inStock: true,
    },
    {
      title: "Audio-Technica ATH-M50x Professional Studio Monitor",
      description: "Critical listening and studio monitoring headphones",
      price: "149.00",
      imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      rating: "4.7",
      reviewCount: 3421,
      brand: "Audio-Technica",
      category: "Professional Audio",
      source: "B&H Photo",
      sourceUrl: "https://bhphotovideo.com/audio-technica-m50x",
      inStock: true,
    },
    {
      title: "Beats Studio Buds True Wireless Noise Cancelling",
      description: "Custom acoustic platform delivers powerful, balanced sound",
      price: "149.95",
      originalPrice: "179.95",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      rating: "4.2",
      reviewCount: 789,
      brand: "Beats",
      category: "Electronics",
      source: "Best Buy",
      sourceUrl: "https://bestbuy.com/beats-studio-buds",
      inStock: true,
    },
  ];

  async scrapeProducts(query: ProductSearchQuery, searchId: string): Promise<InsertProduct[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Filter mock products based on query
    let filteredProducts = this.mockProducts;

    if (query.keywords && query.keywords.length > 0) {
      const keywords = query.keywords.map(k => k.toLowerCase());
      filteredProducts = filteredProducts.filter(product => 
        keywords.some(keyword => 
          product.title.toLowerCase().includes(keyword) ||
          product.description?.toLowerCase().includes(keyword) ||
          product.brand?.toLowerCase().includes(keyword)
        )
      );
    }

    if (query.category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category?.toLowerCase().includes(query.category!.toLowerCase())
      );
    }

    if (query.brand) {
      filteredProducts = filteredProducts.filter(product => 
        product.brand?.toLowerCase().includes(query.brand!.toLowerCase())
      );
    }

    if (query.priceRange) {
      filteredProducts = filteredProducts.filter(product => {
        const price = parseFloat(product.price);
        const min = query.priceRange?.min;
        const max = query.priceRange?.max;
        
        if (min && price < min) return false;
        if (max && price > max) return false;
        return true;
      });
    }

    // Add searchId to all products
    return filteredProducts.map(product => ({
      ...product,
      searchId
    }));
  }

  async getAvailableBrands(): Promise<string[]> {
    const brands = this.mockProducts.map(p => p.brand).filter(Boolean) as string[];
    return Array.from(new Set(brands));
  }

  async getAvailableCategories(): Promise<string[]> {
    const categories = this.mockProducts.map(p => p.category).filter(Boolean) as string[];
    return Array.from(new Set(categories));
  }
}

export const productScraper = new ProductScraper();
