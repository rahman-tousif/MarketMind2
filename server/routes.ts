import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import { storage } from "./storage";
import { processProductDescription, analyzeProductImage, generateChatResponse, transcribeAudio } from "./services/openai";
import { productScraper } from "./services/scraper";
import { insertSearchSchema, insertChatMessageSchema, insertFilterSchema } from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create a new search from text, voice, or image
  app.post("/api/search", upload.single("image"), async (req, res) => {
    try {
      const { query, type = "text" } = req.body;
      
      let processedQuery;
      let imageUrl;
      
      if (type === "image" && req.file) {
        // Process uploaded image
        const processedImage = await sharp(req.file.buffer)
          .resize(800, 600)
          .jpeg({ quality: 80 })
          .toBuffer();
        
        const base64Image = processedImage.toString('base64');
        imageUrl = `data:image/jpeg;base64,${base64Image}`;
        
        // Analyze image with OpenAI
        processedQuery = await analyzeProductImage(base64Image);
      } else if (type === "voice" && req.file) {
        // Transcribe audio
        const transcription = await transcribeAudio(req.file.buffer);
        processedQuery = await processProductDescription(transcription);
      } else {
        // Process text query
        processedQuery = await processProductDescription(query);
      }
      
      // Create search record
      const searchData = insertSearchSchema.parse({
        query: query || JSON.stringify(processedQuery),
        type,
        imageUrl,
      });
      
      const search = await storage.createSearch(searchData);
      
      // Scrape products
      const scrapedProducts = await productScraper.scrapeProducts(processedQuery, search.id);
      const products = await storage.createProducts(scrapedProducts);
      
      // Create initial AI response
      await storage.createChatMessage({
        searchId: search.id,
        message: `I found ${products.length} products matching your search. Would you like me to help you refine the results?`,
        isUser: false,
      });
      
      res.json({
        searchId: search.id,
        query: processedQuery,
        productCount: products.length,
        products: products.slice(0, 20), // Return first 20 products
      });
      
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ 
        message: "Failed to process search request", 
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined 
      });
    }
  });
  
  // Get products for a search with filtering
  app.get("/api/search/:searchId/products", async (req, res) => {
    try {
      const { searchId } = req.params;
      const { 
        minPrice, 
        maxPrice, 
        brands, 
        categories, 
        minRating, 
        sortBy = "relevance",
        page = "1",
        limit = "20" 
      } = req.query;
      
      let products = await storage.getProductsBySearchId(searchId);
      
      // Apply filters
      if (minPrice) {
        const min = parseFloat(minPrice as string);
        products = products.filter(p => parseFloat(p.price) >= min);
      }
      
      if (maxPrice) {
        const max = parseFloat(maxPrice as string);
        products = products.filter(p => parseFloat(p.price) <= max);
      }
      
      if (brands) {
        const brandList = Array.isArray(brands) ? brands : [brands];
        products = products.filter(p => p.brand && brandList.includes(p.brand));
      }
      
      if (categories) {
        const categoryList = Array.isArray(categories) ? categories : [categories];
        products = products.filter(p => p.category && categoryList.includes(p.category));
      }
      
      if (minRating) {
        const rating = parseFloat(minRating as string);
        products = products.filter(p => p.rating && parseFloat(p.rating) >= rating);
      }
      
      // Apply sorting
      switch (sortBy) {
        case "price_low":
          products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case "price_high":
          products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case "rating":
          products.sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"));
          break;
        case "newest":
          products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
        default: // relevance
          // Keep original order
          break;
      }
      
      // Pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      
      const paginatedProducts = products.slice(startIndex, endIndex);
      
      res.json({
        products: paginatedProducts,
        total: products.length,
        page: pageNum,
        limit: limitNum,
        hasMore: endIndex < products.length,
      });
      
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  // Chat with AI about search results
  app.post("/api/search/:searchId/chat", async (req, res) => {
    try {
      const { searchId } = req.params;
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Save user message
      await storage.createChatMessage({
        searchId,
        message,
        isUser: true,
      });
      
      // Get search context
      const search = await storage.getSearch(searchId);
      const products = await storage.getProductsBySearchId(searchId);
      
      if (!search) {
        return res.status(404).json({ message: "Search not found" });
      }
      
      // Generate AI response
      const aiResponse = await generateChatResponse(
        message,
        search.query,
        products.length
      );
      
      // Save AI response
      const aiMessage = await storage.createChatMessage({
        searchId,
        message: aiResponse,
        isUser: false,
      });
      
      res.json({
        message: aiMessage,
        suggestions: [], // Could add product suggestions based on chat
      });
      
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });
  
  // Get chat history
  app.get("/api/search/:searchId/chat", async (req, res) => {
    try {
      const { searchId } = req.params;
      const messages = await storage.getChatMessagesBySearchId(searchId);
      res.json({ messages });
    } catch (error) {
      console.error("Get chat error:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });
  
  // Update search filters
  app.post("/api/search/:searchId/filters", async (req, res) => {
    try {
      const { searchId } = req.params;
      const filterData = insertFilterSchema.parse({ ...req.body, searchId });
      
      const existingFilter = await storage.getFilterBySearchId(searchId);
      
      let filter;
      if (existingFilter) {
        filter = await storage.updateFilter(searchId, filterData);
      } else {
        filter = await storage.createFilter(filterData);
      }
      
      res.json({ filter });
    } catch (error) {
      console.error("Filter error:", error);
      res.status(500).json({ message: "Failed to update filters" });
    }
  });
  
  // Get available filter options
  app.get("/api/filters/options", async (req, res) => {
    try {
      const [brands, categories] = await Promise.all([
        storage.getAvailableBrands(),
        storage.getAvailableCategories(),
      ]);
      
      res.json({
        brands: brands.map(brand => ({ name: brand, count: 0 })), // TODO: Add real counts
        categories: categories.map(category => ({ name: category, count: 0 })),
      });
    } catch (error) {
      console.error("Filter options error:", error);
      res.status(500).json({ message: "Failed to fetch filter options" });
    }
  });
  
  // Get search details
  app.get("/api/search/:searchId", async (req, res) => {
    try {
      const { searchId } = req.params;
      const search = await storage.getSearch(searchId);
      
      if (!search) {
        return res.status(404).json({ message: "Search not found" });
      }
      
      const [products, messages, filter] = await Promise.all([
        storage.getProductsBySearchId(searchId),
        storage.getChatMessagesBySearchId(searchId),
        storage.getFilterBySearchId(searchId),
      ]);
      
      res.json({
        search,
        productCount: products.length,
        messageCount: messages.length,
        filter,
      });
    } catch (error) {
      console.error("Get search error:", error);
      res.status(500).json({ message: "Failed to fetch search details" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
