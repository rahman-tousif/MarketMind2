import { 
  type Search, 
  type InsertSearch, 
  type Product, 
  type InsertProduct,
  type ChatMessage,
  type InsertChatMessage,
  type Filter,
  type InsertFilter
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Searches
  createSearch(search: InsertSearch): Promise<Search>;
  getSearch(id: string): Promise<Search | undefined>;
  
  // Products
  createProducts(products: InsertProduct[]): Promise<Product[]>;
  getProductsBySearchId(searchId: string): Promise<Product[]>;
  
  // Chat messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesBySearchId(searchId: string): Promise<ChatMessage[]>;
  
  // Filters
  createFilter(filter: InsertFilter): Promise<Filter>;
  getFilterBySearchId(searchId: string): Promise<Filter | undefined>;
  updateFilter(searchId: string, filter: Partial<InsertFilter>): Promise<Filter | undefined>;
  
  // Stats
  getAvailableBrands(): Promise<string[]>;
  getAvailableCategories(): Promise<string[]>;
}

export class MemStorage implements IStorage {
  private searches: Map<string, Search> = new Map();
  private products: Map<string, Product> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();
  private filters: Map<string, Filter> = new Map();

  async createSearch(insertSearch: InsertSearch): Promise<Search> {
    const id = randomUUID();
    const search: Search = { 
      ...insertSearch, 
      id, 
      timestamp: new Date(),
      type: insertSearch.type || "text",
      imageUrl: insertSearch.imageUrl || null
    };
    this.searches.set(id, search);
    return search;
  }

  async getSearch(id: string): Promise<Search | undefined> {
    return this.searches.get(id);
  }

  async createProducts(insertProducts: InsertProduct[]): Promise<Product[]> {
    const products: Product[] = [];
    
    for (const insertProduct of insertProducts) {
      const id = randomUUID();
      const product: Product = {
        ...insertProduct,
        id,
        createdAt: new Date(),
        searchId: insertProduct.searchId || null,
        description: insertProduct.description || null,
        originalPrice: insertProduct.originalPrice || null,
        rating: insertProduct.rating || null,
        reviewCount: insertProduct.reviewCount || 0,
        brand: insertProduct.brand || null,
        category: insertProduct.category || null,
        inStock: insertProduct.inStock !== undefined ? insertProduct.inStock : true
      };
      this.products.set(id, product);
      products.push(product);
    }
    
    return products;
  }

  async getProductsBySearchId(searchId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.searchId === searchId
    );
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessagesBySearchId(searchId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.searchId === searchId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createFilter(insertFilter: InsertFilter): Promise<Filter> {
    const id = randomUUID();
    const filter: Filter = { 
      id,
      searchId: insertFilter.searchId,
      minPrice: insertFilter.minPrice || null,
      maxPrice: insertFilter.maxPrice || null,
      brands: (insertFilter.brands as string[]) || null,
      categories: (insertFilter.categories as string[]) || null,
      minRating: insertFilter.minRating || null,
      sortBy: insertFilter.sortBy || null
    };
    this.filters.set(id, filter);
    return filter;
  }

  async getFilterBySearchId(searchId: string): Promise<Filter | undefined> {
    return Array.from(this.filters.values()).find(
      filter => filter.searchId === searchId
    );
  }

  async updateFilter(searchId: string, updateData: Partial<InsertFilter>): Promise<Filter | undefined> {
    const existingFilter = await this.getFilterBySearchId(searchId);
    if (existingFilter) {
      const updatedFilter: Filter = { 
        ...existingFilter,
        minPrice: updateData.minPrice ?? existingFilter.minPrice,
        maxPrice: updateData.maxPrice ?? existingFilter.maxPrice,
        brands: (updateData.brands as string[]) ?? existingFilter.brands,
        categories: (updateData.categories as string[]) ?? existingFilter.categories,
        minRating: updateData.minRating ?? existingFilter.minRating,
        sortBy: updateData.sortBy ?? existingFilter.sortBy
      };
      this.filters.set(existingFilter.id, updatedFilter);
      return updatedFilter;
    }
    return undefined;
  }

  async getAvailableBrands(): Promise<string[]> {
    const brands = new Set<string>();
    const products = Array.from(this.products.values());
    for (const product of products) {
      if (product.brand) {
        brands.add(product.brand);
      }
    }
    return Array.from(brands).sort();
  }

  async getAvailableCategories(): Promise<string[]> {
    const categories = new Set<string>();
    const products = Array.from(this.products.values());
    for (const product of products) {
      if (product.category) {
        categories.add(product.category);
      }
    }
    return Array.from(categories).sort();
  }
}

export const storage = new MemStorage();
